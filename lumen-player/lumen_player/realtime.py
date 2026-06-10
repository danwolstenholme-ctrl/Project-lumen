"""Supabase Realtime subscriber — receives commands from the cloud dashboard.

Implements just enough of the Phoenix channel protocol (over the existing
`websockets` dependency) to join this table's broadcast channel
(`table:<TABLE_ID>`) and receive `command` events published by the venue
dashboard. No inbound connectivity required — a single outbound WSS
connection to Supabase.
"""
from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, Awaitable, Callable

import websockets

log = logging.getLogger(__name__)

HEARTBEAT_INTERVAL_S = 25
RECONNECT_MIN_S = 1
RECONNECT_MAX_S = 30


class RealtimeSubscriber:
    """Joins `realtime:table:<table_id>` and forwards `command` broadcasts."""

    def __init__(
        self,
        supabase_url: str,
        api_key: str,
        table_id: str,
        on_command: Callable[[dict[str, Any]], Awaitable[None]],
    ):
        base = supabase_url.rstrip("/")
        base = base.replace("https://", "wss://").replace("http://", "ws://")
        self._ws_url = f"{base}/realtime/v1/websocket?apikey={api_key}&vsn=1.0.0"
        self._api_key = api_key
        self._topic = f"realtime:table:{table_id}"
        self._on_command = on_command
        self._ref = 0

    def _next_ref(self) -> str:
        self._ref += 1
        return str(self._ref)

    async def run(self) -> None:
        """Connect, join, and process messages forever — reconnecting on failure."""
        backoff = RECONNECT_MIN_S
        while True:
            try:
                await self._session()
                backoff = RECONNECT_MIN_S
            except asyncio.CancelledError:
                raise
            except Exception as e:
                log.warning("realtime connection lost (%s); retrying in %ds", e, backoff)
            await asyncio.sleep(backoff)
            backoff = min(backoff * 2, RECONNECT_MAX_S)

    async def _session(self) -> None:
        async with websockets.connect(self._ws_url, max_size=2**20) as ws:
            await self._join(ws)
            log.info("realtime: subscribed to %s", self._topic)
            heartbeat = asyncio.create_task(self._heartbeat(ws))
            try:
                async for raw in ws:
                    await self._handle_message(raw)
            finally:
                heartbeat.cancel()
                try:
                    await heartbeat
                except asyncio.CancelledError:
                    pass

    async def _join(self, ws) -> None:
        await ws.send(json.dumps({
            "topic": self._topic,
            "event": "phx_join",
            "payload": {
                "config": {
                    "broadcast": {"self": False, "ack": False},
                    "presence": {"key": ""},
                    "postgres_changes": [],
                },
                "access_token": self._api_key,
            },
            "ref": self._next_ref(),
        }))

    async def _heartbeat(self, ws) -> None:
        while True:
            await asyncio.sleep(HEARTBEAT_INTERVAL_S)
            await ws.send(json.dumps({
                "topic": "phoenix",
                "event": "heartbeat",
                "payload": {},
                "ref": self._next_ref(),
            }))

    async def _handle_message(self, raw: str | bytes) -> None:
        try:
            msg = json.loads(raw)
        except json.JSONDecodeError:
            log.debug("realtime: non-JSON frame ignored")
            return

        event = msg.get("event")
        if event == "phx_reply":
            status = (msg.get("payload") or {}).get("status")
            if status != "ok":
                log.warning("realtime: reply status=%s payload=%s", status, msg.get("payload"))
            return
        if event != "broadcast" or msg.get("topic") != self._topic:
            return

        payload = msg.get("payload") or {}
        if payload.get("event") != "command":
            return
        cmd = payload.get("payload")
        if not isinstance(cmd, dict):
            log.warning("realtime: malformed command payload: %r", cmd)
            return

        log.info("realtime command: %s", cmd.get("action") or cmd.get("type"))
        try:
            await self._on_command(cmd)
        except Exception:
            log.exception("command handler failed")
