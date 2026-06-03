# Lumen Player

On-table software for Project Lumen. Runs on a Raspberry Pi 5 attached to a 4K projector (or monitor during prototyping), listens for control commands from the Lumen iPad app over WebSocket, and plays HLS video full-screen via mpv.

See [`LUMEN_HARDWARE_SPEC.md`](../LUMEN_HARDWARE_SPEC.md) in the parent repo for the hardware BOM and the full WebSocket protocol.

## Architecture

```
┌─────────────────┐   WebSocket :8765    ┌─────────────────┐
│  iPad app       │ ───────────────────► │  Lumen Player   │
│  (Quick Play)   │   JSON commands      │  (Python)       │
└─────────────────┘                      └────────┬────────┘
                                                  │ JSON IPC
                                                  ▼ Unix socket
                                          ┌─────────────────┐
                                          │  mpv            │
                                          │  HLS playback   │
                                          └────────┬────────┘
                                                   │ HDMI
                                                   ▼
                                          [ 4K projector ]

         Pi also POSTs status changes to Supabase REST so the
         iPad dashboard's table chips stay live in real time.
```

## Project layout

```
lumen-player/
├── lumen_player/                # Python package
│   ├── __main__.py              # Entry point: `python -m lumen_player`
│   ├── config.py                # Env-var parsing
│   ├── log.py                   # Logging setup
│   ├── supabase_client.py       # REST client for status + show lookup
│   ├── player.py                # mpv subprocess wrapper (JSON IPC)
│   └── server.py                # WebSocket server + command dispatch
├── systemd/
│   └── lumen-player.service     # systemd unit for auto-start on boot
├── scripts/
│   ├── install.sh               # One-shot installer (run on the Pi)
│   └── flash-prep.md            # First-time Pi setup guide
├── env.example                  # Environment variable template
├── requirements.txt
├── pyproject.toml
└── README.md (this file)
```

## Quick start on a Raspberry Pi

See [`scripts/flash-prep.md`](scripts/flash-prep.md) for the full end-to-end procedure. Short version:

```bash
# On your laptop
scp -r lumen-player pi@<pi-ip>:~/

# On the Pi
ssh pi@<pi-ip>
cd ~/lumen-player
sudo ./scripts/install.sh
sudo nano /etc/lumen-player/env       # fill in SUPABASE_URL, SUPABASE_SERVICE_KEY, TABLE_ID
sudo systemctl start lumen-player
sudo journalctl -u lumen-player -f
```

## Local development on macOS

You can run the player on your Mac for protocol testing — mpv works fine, just plays in a regular window instead of fullscreen on a projector.

```bash
brew install mpv python@3.11

cd lumen-player
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Set env vars (use direnv or .envrc to persist)
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_KEY=eyJ...
export TABLE_ID=<a-real-tables-row-uuid>

python -m lumen_player
```

In another terminal, send commands using `wscat`:

```bash
npm install -g wscat
wscat -c ws://localhost:8765

> {"type":"ping"}
< {"type":"pong","ts_ms":1717414800000}

> {"type":"play","show_id":"<uuid-of-a-published-show>","timestamp_ms":1717414800000}
< {"type":"status","state":"playing","show_id":"..."}

> {"type":"stop"}
< {"type":"status","state":"idle"}
```

## WebSocket protocol

| Direction | Command | Payload |
|---|---|---|
| iPad → Pi | `play` | `{type:"play", show_id, timestamp_ms, volume?, brightness?}` |
| iPad → Pi | `pause` | `{type:"pause"}` |
| iPad → Pi | `resume` | `{type:"resume"}` |
| iPad → Pi | `stop` | `{type:"stop"}` |
| iPad → Pi | `volume` | `{type:"volume", value: 0..1}` |
| iPad → Pi | `brightness` | `{type:"brightness", value: 0..1}` |
| iPad → Pi | `ping` | `{type:"ping"}` |
| Pi → iPad | `status` | `{type:"status", state, show_id?}` |
| Pi → iPad | `pong` | `{type:"pong", ts_ms}` |
| Pi → iPad | `ok` | `{type:"ok"}` (for fire-and-forget commands) |
| Pi → iPad | `error` | `{type:"error", message}` |

## Sync model

On `play`, the iPad sends a wall-clock `timestamp_ms`. The Pi computes:

```
elapsed_s = (now_ms - timestamp_ms) / 1000
offset_s  = elapsed_s % video_duration_s
```

…and seeks mpv to `offset_s` before starting playback. All tables that receive the same `play` command at roughly the same moment converge to playing the same frame within ~50–150ms on a wired LAN. That's well below the perception threshold for ambient looping content.

For frame-exact sync (only needed if Lumen ever does coordinated explosive visual events), the architecture would pre-download the video once and use PTP time sync. Out of scope for prototype.

## MVP scope vs future

**MVP (this build):** play, pause, resume, stop, volume, brightness, ping. Status reporting to Supabase. Systemd auto-restart on crash.

**Future:**
- Pre-cache video file for offline + frame-exact sync
- Exponential-backoff reconnect to Supabase
- Per-table JWT instead of full service-role key (security)
- Health metrics (decode FPS, dropouts) reported to Supabase
- Multi-show queue + crossfade
- Sound Hub variant (audio-only sibling for venue PA)

## Status

`v0.1.0` — MVP. Not yet tested on real Pi hardware (built in advance of hardware delivery, see Stage 1 of the [hardware spec](../LUMEN_HARDWARE_SPEC.md#stage-1--software-pipeline-validation)). First end-to-end test will validate the design.

## License

© 2026 Wolsten Studios LTD. Built for SRS Dynamic under contract. All rights reserved.
