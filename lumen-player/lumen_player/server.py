"""Command dispatch + local WebSocket server.

Primary command transport is the Supabase Realtime channel (see realtime.py),
which calls `dispatch()` directly. The LAN WebSocket server is kept as a
bench-test fallback (wscat / local development).
"""
from __future__ import annotations

import asyncio
import json
import logging
import time
from typing import Any

import websockets

from .player import MpvPlayer
from .supabase_client import SupabaseClient

log = logging.getLogger(__name__)


class LumenPlayerServer:
    def __init__(self, port: int, player: MpvPlayer, supabase: SupabaseClient):
        self._port = port
        self._player = player
        self._supabase = supabase
        self._current_show_id: str | None = None

    async def run(self) -> None:
        await self._supabase.update_table_status("online_idle")
        log.info("listening on ws://0.0.0.0:%d", self._port)
        async with websockets.serve(self._handle, "0.0.0.0", self._port):
            await asyncio.Future()  # run forever

    async def _handle(self, ws) -> None:
        peer = ws.remote_address
        log.info("client connected: %s", peer)
        try:
            async for raw in ws:
                try:
                    cmd = json.loads(raw)
                except json.JSONDecodeError:
                    await ws.send(json.dumps({"type": "error", "message": "invalid json"}))
                    continue
                await self.dispatch(cmd, ws)
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            log.info("client disconnected: %s", peer)

    async def dispatch(self, cmd: dict[str, Any], ws=None) -> None:
        """Execute a command. `ws` is optional — Realtime commands have no
        reply socket; status flows back via Supabase REST instead."""

        async def reply(msg: dict[str, Any]) -> None:
            if ws is not None:
                await ws.send(json.dumps(msg))

        # Canonical field is "action" (what the dashboard sends);
        # "type" is accepted as a legacy alias per the original hardware spec.
        ctype = cmd.get("action") or cmd.get("type")
        try:
            if ctype == "play":
                await self._handle_play(cmd, reply)
            elif ctype == "pause":
                await self._player.set_pause(True)
                await reply({"type": "status", "state": "paused"})
            elif ctype == "resume":
                await self._player.set_pause(False)
                await reply({"type": "status", "state": "playing"})
            elif ctype == "stop":
                await self._player.stop_playback()
                self._current_show_id = None
                await self._supabase.update_table_status("online_idle")
                await reply({"type": "status", "state": "idle"})
            elif ctype == "volume":
                await self._player.set_volume(float(cmd["value"]))
                await reply({"type": "ok"})
            elif ctype == "brightness":
                await self._player.set_brightness(float(cmd["value"]))
                await reply({"type": "ok"})
            elif ctype == "ping":
                await reply({"type": "pong", "ts_ms": int(time.time() * 1000)})
            else:
                log.warning("unknown command: %s", ctype)
                await reply({"type": "error", "message": f"unknown command: {ctype}"})
        except Exception as e:
            log.exception("command failed: %s", ctype)
            await reply({"type": "error", "message": str(e)})

    async def _handle_play(self, cmd: dict[str, Any], reply) -> None:
        show_id = cmd.get("show_id")
        if not show_id:
            await reply({"type": "error", "message": "play missing show_id"})
            return

        # Canonical field is "timestamp" (what the dashboard sends);
        # "timestamp_ms" is accepted as a legacy alias.
        timestamp_ms = int(cmd.get("timestamp") or cmd.get("timestamp_ms") or time.time() * 1000)

        show = await self._supabase.get_show(show_id)
        if not show or not show.get("mux_playback_id"):
            await reply({"type": "error", "message": "show not playable"})
            return

        playback_id = show["mux_playback_id"]
        url = f"https://stream.mux.com/{playback_id}.m3u8"

        # Compute sync offset from the iPad's wall-clock timestamp.
        metadata = show.get("video_metadata") or {}
        duration_s = float(metadata.get("duration") or 0)
        offset_s = 0.0
        if duration_s > 0:
            elapsed_s = max(0.0, (time.time() * 1000 - timestamp_ms) / 1000.0)
            offset_s = elapsed_s % duration_s

        log.info("play show=%s offset=%.2fs", show_id, offset_s)
        await self._player.play(url, offset_s)

        # Optional initial volume/brightness in the same command.
        if "volume" in cmd:
            await self._player.set_volume(float(cmd["volume"]))
        if "brightness" in cmd:
            await self._player.set_brightness(float(cmd["brightness"]))

        self._current_show_id = show_id
        await self._supabase.update_table_status("online_playing")
        await reply({"type": "status", "state": "playing", "show_id": show_id})
