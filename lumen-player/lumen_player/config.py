"""Runtime configuration — populated from the environment."""
from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Config:
    supabase_url: str
    supabase_service_key: str
    table_id: str
    ws_port: int
    log_level: str
    mpv_ipc_socket: str

    @classmethod
    def from_env(cls) -> "Config":
        return cls(
            supabase_url=_required("SUPABASE_URL"),
            supabase_service_key=_required("SUPABASE_SERVICE_KEY"),
            table_id=_required("TABLE_ID"),
            ws_port=int(os.environ.get("WS_PORT", "8765")),
            log_level=os.environ.get("LOG_LEVEL", "INFO"),
            mpv_ipc_socket=os.environ.get("MPV_IPC_SOCKET", "/tmp/mpv-lumen.sock"),
        )


def _required(name: str) -> str:
    val = os.environ.get(name)
    if not val:
        raise RuntimeError(f"missing required environment variable: {name}")
    return val
