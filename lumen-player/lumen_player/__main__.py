"""Entry point — `python -m lumen_player`.

Boots mpv, subscribes to this table's Supabase Realtime command channel
(primary transport), and starts the LAN WebSocket server (bench fallback).
"""
from __future__ import annotations

import asyncio
import logging
import signal

from . import log as log_setup
from .config import Config
from .player import MpvPlayer
from .realtime import RealtimeSubscriber
from .server import LumenPlayerServer
from .supabase_client import SupabaseClient


async def amain() -> None:
    cfg = Config.from_env()
    log_setup.setup(cfg.log_level)
    log = logging.getLogger("lumen_player")
    log.info("starting Lumen Player for table %s", cfg.table_id)

    player = MpvPlayer(cfg.mpv_ipc_socket, cfg.mpv_fullscreen_screen)
    supabase = SupabaseClient(cfg.supabase_url, cfg.supabase_service_key, cfg.table_id)

    await player.start()
    server = LumenPlayerServer(cfg.ws_port, player, supabase)
    realtime = RealtimeSubscriber(
        cfg.supabase_url,
        cfg.supabase_service_key,
        cfg.table_id,
        on_command=server.dispatch,
    )

    stop_event = asyncio.Event()

    def _handle_signal():
        log.info("shutdown signal received")
        stop_event.set()

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, _handle_signal)

    tasks = [
        asyncio.create_task(realtime.run()),
        asyncio.create_task(server.run()),
    ]
    try:
        await stop_event.wait()
    finally:
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
        log.info("shutting down")
        try:
            await supabase.update_table_status("offline")
        except Exception:
            log.exception("failed to mark table offline")
        await player.stop()
        await supabase.close()


def main() -> None:
    asyncio.run(amain())


if __name__ == "__main__":
    main()
