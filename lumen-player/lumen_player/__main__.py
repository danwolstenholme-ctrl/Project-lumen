"""Entry point — `python -m lumen_player`. Boots mpv, starts WS server."""
from __future__ import annotations

import asyncio
import logging
import signal

from . import log as log_setup
from .config import Config
from .player import MpvPlayer
from .server import LumenPlayerServer
from .supabase_client import SupabaseClient


async def amain() -> None:
    cfg = Config.from_env()
    log_setup.setup(cfg.log_level)
    log = logging.getLogger("lumen_player")
    log.info("starting Lumen Player for table %s", cfg.table_id)

    player = MpvPlayer(cfg.mpv_ipc_socket)
    supabase = SupabaseClient(cfg.supabase_url, cfg.supabase_service_key, cfg.table_id)

    await player.start()
    server = LumenPlayerServer(cfg.ws_port, player, supabase)

    stop_event = asyncio.Event()

    def _handle_signal():
        log.info("shutdown signal received")
        stop_event.set()

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, _handle_signal)

    server_task = asyncio.create_task(server.run())
    try:
        await stop_event.wait()
    finally:
        server_task.cancel()
        try:
            await server_task
        except asyncio.CancelledError:
            pass
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
