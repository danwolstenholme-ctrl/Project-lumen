"""mpv wrapper — spawns mpv and talks to it via JSON IPC over a Unix socket."""
from __future__ import annotations

import asyncio
import json
import logging
from pathlib import Path
from typing import Any

log = logging.getLogger(__name__)


class MpvPlayer:
    """Long-lived mpv subprocess controlled over its `--input-ipc-server` socket.

    mpv stays running in idle mode with a black fullscreen window; we send it
    `loadfile` / `set_property` commands as iPad commands arrive.
    """

    def __init__(self, socket_path: str):
        self._socket_path = socket_path
        self._proc: asyncio.subprocess.Process | None = None
        self._reader: asyncio.StreamReader | None = None
        self._writer: asyncio.StreamWriter | None = None
        self._req_id = 0
        self._lock = asyncio.Lock()

    async def start(self) -> None:
        sock = Path(self._socket_path)
        if sock.exists():
            sock.unlink()

        log.info("starting mpv...")
        self._proc = await asyncio.create_subprocess_exec(
            "mpv",
            "--idle=yes",
            "--force-window=immediate",
            "--fullscreen",
            "--loop-file=inf",
            "--no-osc",
            "--no-osd-bar",
            "--no-input-terminal",
            "--input-default-bindings=no",
            "--input-vo-keyboard=no",
            "--keep-open=yes",
            "--hwdec=auto",
            f"--input-ipc-server={self._socket_path}",
            stdin=asyncio.subprocess.DEVNULL,
            stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.PIPE,
        )

        # Wait for mpv to create the IPC socket (up to 10s).
        for _ in range(50):
            if sock.exists():
                break
            await asyncio.sleep(0.2)
        else:
            raise RuntimeError("mpv did not create IPC socket within 10s")

        self._reader, self._writer = await asyncio.open_unix_connection(self._socket_path)
        log.info("mpv ready (ipc=%s)", self._socket_path)

    async def stop(self) -> None:
        if self._writer:
            try:
                self._writer.close()
                await self._writer.wait_closed()
            except Exception:
                pass
        if self._proc and self._proc.returncode is None:
            self._proc.terminate()
            try:
                await asyncio.wait_for(self._proc.wait(), timeout=5)
            except asyncio.TimeoutError:
                self._proc.kill()
                await self._proc.wait()

    async def _command(self, *args: Any) -> dict:
        async with self._lock:
            if self._writer is None or self._reader is None:
                raise RuntimeError("mpv not connected")
            self._req_id += 1
            payload = {"command": list(args), "request_id": self._req_id}
            self._writer.write((json.dumps(payload) + "\n").encode())
            await self._writer.drain()
            # mpv may send unsolicited events; read until we get our response.
            while True:
                line = await self._reader.readline()
                if not line:
                    raise RuntimeError("mpv socket closed unexpectedly")
                msg = json.loads(line.decode())
                if msg.get("request_id") == self._req_id:
                    return msg

    async def play(self, url: str, start_offset_seconds: float = 0.0) -> None:
        """Load and play an HLS URL, seeking to start_offset_seconds first."""
        offset = max(0.0, start_offset_seconds)
        await self._command("loadfile", url, "replace", f"start={offset:.3f}")
        await self._command("set_property", "pause", False)

    async def stop_playback(self) -> None:
        await self._command("stop")

    async def set_pause(self, paused: bool) -> None:
        await self._command("set_property", "pause", paused)

    async def set_volume(self, value: float) -> None:
        """value: 0..1, mapped to mpv volume 0..100."""
        v = max(0, min(100, int(round(value * 100))))
        await self._command("set_property", "volume", v)

    async def set_brightness(self, value: float) -> None:
        """value: 0..1, where 1.0 is full brightness and 0.0 is fully dimmed.

        mpv's brightness range is -100..100 (0 = no change). We map 0..1 to -100..0
        so 1.0 leaves the image untouched and lower values dim it.
        """
        v = max(-100, min(0, int(round((value - 1.0) * 100))))
        await self._command("set_property", "brightness", v)
