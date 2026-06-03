"""Supabase REST client — status updates back to the venue dashboard + show lookup."""
from __future__ import annotations

import logging
from typing import Any

import httpx

log = logging.getLogger(__name__)


class SupabaseClient:
    def __init__(self, url: str, service_key: str, table_id: str):
        self._base = url.rstrip("/")
        self._table_id = table_id
        self._headers = {
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
        }
        self._client = httpx.AsyncClient(timeout=10.0)

    async def close(self) -> None:
        await self._client.aclose()

    async def get_show(self, show_id: str) -> dict[str, Any] | None:
        """Fetch a published show by id. Returns the row dict, or None on miss/error."""
        try:
            resp = await self._client.get(
                f"{self._base}/rest/v1/shows",
                headers=self._headers,
                params={
                    "id": f"eq.{show_id}",
                    "select": "id,title,mux_playback_id,video_metadata,status",
                },
            )
            resp.raise_for_status()
            rows = resp.json()
            return rows[0] if rows else None
        except Exception:
            log.exception("get_show failed for %s", show_id)
            return None

    async def update_table_status(self, status: str) -> None:
        """Set this table's status (online_playing | online_idle | offline)."""
        try:
            await self._client.patch(
                f"{self._base}/rest/v1/tables",
                headers={**self._headers, "Prefer": "return=minimal"},
                params={"id": f"eq.{self._table_id}"},
                json={"status": status},
            )
            log.debug("table status -> %s", status)
        except Exception:
            log.exception("update_table_status failed")
