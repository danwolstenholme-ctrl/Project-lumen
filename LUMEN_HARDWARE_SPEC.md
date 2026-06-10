<!--
  [ replace this comment block with Wolsten Studios brand cover ]
  [ logo · wordmark · client logo · "Confidential" classification ]
-->

# Project Lumen — Table Hardware & Lumen Player Specification

**Prepared by:** Wolsten Studios LTD
**Prepared for:** SRS Dynamic
**Project:** Project Lumen — immersive dining platform
**Document version:** 1.0
**Date:** [DATE]
**Classification:** Confidential — Wolsten Studios & SRS Dynamic
**Conversion to PDF:** Open this `.md` file in VSCode with the "Markdown PDF" extension installed → right-click → *Markdown PDF: Export (pdf)*. Alternatively render in any markdown previewer and print to PDF.

---

## 1. Purpose

This document specifies the per-table hardware required for a Project Lumen installation, the on-table software (the **Lumen Player**), the network architecture binding tables to the central app, and a two-stage prototype build plan culminating in a single, working physical table that can be controlled from the iPad Quick Play interface in production.

It is the procurement & assembly reference for the first prototype build, and the basis for subsequent venue installations.

---

## 2. System Overview

Each Lumen table is, functionally, a small networked computer with a downward-facing 4K projector. The iPad app (already live at `app.projectlumen.io`) discovers each table by its static LAN IP and issues commands over WebSocket. The table fetches video content directly from Mux's HLS CDN — content does not stream through Lumen's app server.

```
┌────────────────────────────────────────────────────────────────────────┐
│                            VENUE PREMISES                              │
│                                                                         │
│   ┌──────────┐                  ┌──────────────────┐                    │
│   │  iPad    │   ws://table-ip  │   Table 1         │                   │
│   │  (Quick  │ ───────────────► │   ┌─────────────┐ │                   │
│   │  Play)   │   :8765 JSON     │   │  Pi 5        │ │   HDMI 2.0 ──►   │
│   └──────────┘                  │   │  Lumen      │ │   ┌────────────┐ │
│        │                        │   │  Player     │ │   │  Projector │ │
│        │                        │   └─────────────┘ │   │  4K @ 60Hz │ │
│        │                        │         │         │   │            │ │
│        │                        │         │  HLS    │   │   ▼ ▼ ▼    │ │
│        │                        │         ▼         │   └────────────┘ │
│        │  ws to all tables      │   ┌─────────────┐ │   projects DOWN │
│        ├────────────────────────►   │   Table 2   │ │   onto 160x90cm  │
│        │  same wall-clock       │   └─────────────┘ │   table surface  │
│        │  timestamp             │                   │                  │
│        │                        │   ┌─────────────┐ │                  │
│        └────────────────────────►   │   Table N   │ │                  │
│                                 │   └─────────────┘ │                  │
│   LAN  ◄────────────────────────┘                                      │
│   192.168.x.x                                                          │
└────────────────────────────────────────────────────────────────────────┘
                    │
                    │  Internet
                    ▼
   ┌──────────────────────────────────────────────────────────────┐
   │  Project Lumen Cloud                                         │
   │  ┌─────────────────┐    ┌──────────────┐    ┌──────────────┐ │
   │  │ Vercel (Next.js) │    │  Supabase    │    │  Mux         │ │
   │  │ app.projectlumen │    │ (tables row, │    │ (HLS .m3u8   │ │
   │  │   .io            │    │  status,     │    │  for each    │ │
   │  │                 │    │  realtime)   │    │  piece)      │ │
   │  └─────────────────┘    └──────────────┘    └──────────────┘ │
   └──────────────────────────────────────────────────────────────┘
```

**Key points:**
- Video bytes flow directly from Mux's CDN to each table — bypassing Lumen's app server for performance and bandwidth efficiency
- Control commands flow LAN-locally from iPad → table via WebSocket — sub-50ms latency
- Status (`online_playing`, `online_idle`, `offline`) flows back via Supabase REST so the iPad dashboard's table chips stay live in real time
- One iPad command + one wall-clock timestamp = all tables play in sync, with no central coordinator

---

## 3. Per-Table Hardware — Bill of Materials

Production-grade choices for the prototype. Specific SKUs given where they matter; substitutes acceptable as noted.

### 3.1 Compute (the heart of the table)

| Item | Specific product | Quantity | ~Cost (£) | Notes |
|---|---|---|---|---|
| Single-board computer | **Raspberry Pi 5 (8GB)** | 1 | 80 | 8GB variant only — 4GB is too tight for 4K HLS buffering. Hardware **H.265/HEVC** decode at 4K@60fps. ⚠️ The Pi 5 has **no H.264 hardware decoder** — see risk #8: Mux's HLS renditions are H.264, which must be software-decoded. |
| Storage | SanDisk Extreme microSDXC 64GB A2 V30 | 1 | 15 | A2 rating mandatory for IOPS during boot + journal writes |
| Power supply | Official Raspberry Pi 27W USB-C PSU | 1 | 12 | Pi 5 needs 5V @ 5A — generic USB-C bricks will undervolt and degrade performance |
| Case | **Argon NEO 5** (passive heatsink) | 1 | 25 | Fanless for restaurant ambient-noise. Aluminium body acts as the heatsink. |
| Video out | Micro-HDMI to HDMI 2.0 cable, 1m | 1 | 10 | Pi 5 uses micro-HDMI. Cable must be HDMI 2.0 spec to carry 4K@60Hz. |
| Network cable | Cat6 ethernet, 2m | 1 | 5 | Wired strongly preferred over WiFi for sync reliability |
| **Compute subtotal** | | | **~147** | |

### 3.2 Display — two paths

**Path A: Direct projector (production target)**

| Item | Specific product | Quantity | ~Cost (£) | Notes |
|---|---|---|---|---|
| 4K projector | **BenQ TK700STi** | 1 | 1,300 | 4K @ 60Hz native, 3000 lumens, throw ratio 0.9–1.08 |
| Adjustable overhead mount | Generic ceiling/I-beam mount with extension arm | 1 | 100 | Needs to hold projector ~1.6m above the table (see § 3.3 throw geometry) |
| First-surface mirror (optional) | 200×150mm first-surface mirror + custom bracket | 1 | 80 | If using mirror geometry to compress vertical footprint |
| **Display subtotal (path A)** | | | **~1,400–1,480** | |

> ⚠️ **Throw geometry note.** Lumen's spec calls for an 80cm height projecting 160cm wide — a throw ratio of **0.5**. The 4K@60Hz commodity market has a gap there (ultra-short-throws are too short, standard short-throws are too long). The BenQ TK700STi at ~1.0 throw ratio needs a 1.6m mount height. This works for a prototype but is visually intrusive in production. **Production hardware will likely need a custom-optic or specialty short-throw projector (£4–10k range)** — that procurement is a Phase 3 task and not blocking for prototyping.

**Path B: 4K monitor (Stage 1 software-only prototype)**

| Item | Specific product | Quantity | ~Cost (£) | Notes |
|---|---|---|---|---|
| 27" 4K@60Hz monitor | **LG 27UP650-W** (or any 4K@60Hz HDMI 2.0 display) | 1 | 270 | Used face-up to mimic table-surface projection. Validates software pipeline only. |
| **Display subtotal (path B)** | | | **~270** | |

### 3.3 Mounting + physical (Path A only)

For a prototype, a height-adjustable lighting stand or photographic boom stand is sufficient to position the projector overhead while geometry is being dialled in. Production install will need permanent ceiling/structural mounting bespoke to each venue.

| Item | Specific product | Quantity | ~Cost (£) | Notes |
|---|---|---|---|---|
| Heavy-duty light stand (prototype only) | Manfrotto 1004BAC or equivalent, 3.6m max height | 1 | 130 | Replace with permanent mount in production |
| Cable management | Generic cable raceway / Velcro ties | — | 15 | |

### 3.4 Audio (Phase 3 — Sound Hub)

Audio is **out of scope for the prototype** per the architectural decision recorded in [LUMEN_NEXT.md](LUMEN_NEXT.md) (Sound Hub deferred to Phase 3). The Pi will play audio from the HLS stream over HDMI; in the prototype this audio is muted or routed to a single small speaker. Production venues with the Sound Hub upgrade will run a sibling Pi connected to the venue PA — to be specced separately.

### 3.5 Total per-table cost summary

| Scenario | ~Cost (£) |
|---|---|
| **Stage 1 prototype** (Pi 5 + 4K monitor) | **~420** |
| **Stage 2 prototype** (Pi 5 + BenQ projector + stand + mount) | **~1,680** |
| **Production estimate per table** (compute + production-grade short-throw 4K projector + ceiling mount + integration) | **~£4,000–7,000** (subject to projector selection in Phase 3) |

---

## 4. Networking Architecture

Each table needs a stable, low-latency LAN connection to the iPad. Wired ethernet via the venue's existing switch is strongly preferred — WiFi adds 10–50ms of jitter that affects multi-table sync precision.

### 4.1 IP assignment

Each Pi gets a **static IP via DHCP reservation** on the venue's router. The DHCP reservation binds the Pi's MAC address to a chosen IP — IP doesn't change between reboots, but assignment is centrally managed by the router.

This IP is what gets stored in the Supabase `tables.ip_address` column. The iPad reads it and opens `ws://<ip>:8765`.

### 4.2 Router/switch requirements

- Gigabit ethernet (most modern consumer routers do this)
- Enough LAN ports for [number of tables + iPad + 1 spare], or a managed switch (TP-Link / Netgear / Ubiquiti) for venues with 8+ tables
- Static-IP / DHCP reservation capability (any reasonable router)
- For larger venues: a VLAN segregating Lumen traffic from venue staff/guest WiFi

### 4.3 Internet upstream

Each table's HLS stream from Mux is ~5–15 Mbps for 4K at "plus" quality. A 12-table venue at peak draws ~180 Mbps of internet upstream. Most fibre installs in commercial premises are 200/200 or 1000/1000 — should be comfortable.

### 4.4 Outbound firewall

Each Pi needs outbound HTTPS access to:
- `stream.mux.com` (HLS video)
- `image.mux.com` (Mux-generated thumbnails / preview gifs)
- `<project>.supabase.co` (REST + Realtime for status updates)

No inbound from the internet is needed — control is LAN-only.

---

## 5. The Lumen Player

The on-table software. This component **exists in this repo** at `lumen-player/` (Python 3.11, mpv via JSON IPC, ~80% complete — see `lumen-player/README.md`).

### 5.1 What it does

A long-running process on the Pi that:

1. Listens on `ws://0.0.0.0:8765` for control commands from the iPad
2. Plays full-screen video on the connected HDMI output
3. Reports its own status (`online_playing`, `online_idle`, `offline`) back to Supabase via REST so the iPad dashboard stays live
4. Survives reboots, network blips, and content changes gracefully

### 5.2 Tech stack (proposed)

| Layer | Choice | Reasoning |
|---|---|---|
| Language | **Python 3.11** | Easy iteration, good libs, runs fine on Pi 5 at this workload |
| Video playback | **mpv** (invoked via IPC) | GPU-accelerated, accepts HLS URLs natively, frame-accurate seek, has a JSON IPC socket for control |
| WebSocket server | `websockets` (Python lib) | Standard, well-maintained, async-friendly |
| HTTP client | `httpx` | For Supabase REST calls |
| Process management | `systemd` unit | Auto-restarts on crash, starts on boot, stops cleanly on shutdown |
| OS | **Raspberry Pi OS Lite (64-bit, Bookworm)** | Minimal install, no desktop, fast boot |

### 5.3 WebSocket protocol

Commands sent by iPad → Pi (JSON over WebSocket text frames).

> **Canonical field names (2026-06-10):** the command field is **`action`** and the
> wall-clock key is **`timestamp`** (ms) — matching what the production dashboard
> (`QuickPlay.tsx` / `ControlPanel.tsx`) actually sends. The player additionally
> accepts `type` / `timestamp_ms` as legacy aliases from earlier drafts of this spec.

| Command | Payload | Behaviour |
|---|---|---|
| `play` | `{action:"play", show_id, timestamp, volume?, brightness?}` | Fetch show row from Supabase, look up `mux_playback_id`, construct HLS URL, start mpv with seek computed from `timestamp` |
| `pause` | `{action:"pause"}` | Send `cycle pause` to mpv |
| `resume` | `{action:"resume"}` | Same — toggles |
| `stop` | `{action:"stop"}` | Stop mpv, return to idle state (blank screen) |
| `volume` | `{action:"volume", value: 0..1}` | Set mpv volume |
| `brightness` | `{action:"brightness", value: 0..1}` | Software brightness (mpv `--brightness=<-100..100>` mapped) |
| `ping` | `{action:"ping"}` | Health check, Pi responds with `pong` |

Optional Pi → iPad messages over the same socket:

| Message | Payload | When |
|---|---|---|
| `status` | `{type:"status", state, show_id?, position_ms?}` | On state changes, every 5s while playing |
| `pong` | `{type:"pong", uptime_seconds}` | Response to `ping` |
| `error` | `{type:"error", code, message}` | On failure (network, decode, HDMI lost) |

### 5.4 Sync mechanism

The whole "every table starts the same show at the same instant" effect hinges on a shared wall-clock timestamp.

**At iPad-side (already implemented in `QuickPlay.tsx`):**

```ts
const startAt = Date.now();
tables.forEach(t => {
  ws[t.id].send(JSON.stringify({
    action: "play",
    show_id: currentShow.id,
    timestamp: startAt,
  }));
});
```

**At Pi-side (implemented in `lumen-player/lumen_player/server.py`):**

```python
elapsed_ms = (now_ms() - timestamp) % video_duration_ms
mpv.command("loadfile", hls_url, "replace", { "start": elapsed_ms / 1000 })
```

The mpv `start` option seeks to that position before beginning playback. Combined with mpv's internal buffer pre-fill, tables converge to playing the same frame within **~50–150ms** on a wired LAN. That's well below the perception threshold for ambient looping content.

For frame-exact sync (Phase 3 if ever needed for explosive coordinated effects), the architecture would move to pre-downloading the video file once and seeking locally with PTP time sync. Not required for prototype.

### 5.5 Status reporting

When mpv changes state, the Python wrapper POSTs to Supabase:

```python
httpx.patch(
  f"{SUPABASE_URL}/rest/v1/tables?id=eq.{table_id}",
  headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"},
  json={"status": "online_playing"}  # or "online_idle" / "offline"
)
```

Supabase Realtime publishes that row change to all connected venue dashboards — the iPad's table-status chips update within ~200ms.

### 5.6 MVP scope (first prototype)

For the Stage 1 prototype, the Lumen Player only needs to handle:
- `play` and `stop` commands
- Single show at a time (no queue)
- HLS playback via mpv
- Status reporting (`online_idle` / `online_playing` / `offline`)
- Auto-start on Pi boot via systemd
- Auto-reconnect on network/WS failure

Volume, brightness, pause/resume, error reporting can land in Stage 2+.

**Status (2026-06-10):** the player is built and lives at `lumen-player/` in this repo. The full MVP scope above is implemented, *plus* volume/brightness/pause/resume. Remaining before Stage 1 sign-off: 5s status heartbeat while playing, and the mixed-content/TLS resolution (risk #9).

---

## 6. Prototype Build Plan

### Stage 1 — Software pipeline validation (target: ~£420, 1 week)

**Goal:** prove that an iPad command can play a Lumen piece on a Pi-driven display.

| Step | Owner | Days |
|---|---|---|
| Order Stage 1 BOM (Pi 5, accessories, microSD, monitor) | Wolsten Studios | 0 (next-day delivery) |
| Flash Raspberry Pi OS Lite (64-bit) to microSD, boot Pi, connect to LAN, get IP | Wolsten Studios | 0.5 |
| Deploy Lumen Player from `lumen-player/` (already built — see § 5.6) via `scripts/install.sh` + systemd unit | Wolsten Studios | 0.5 |
| Bench-test playback: measure 4K H.264 software-decode performance and Pi temps (risk #8 decision gate) | Wolsten Studios | 1 |
| Insert a `tables` row in Supabase with the Pi's IP. Configure Pi to use the same env credentials (read-only via service role) | Wolsten Studios | 0.5 |
| End-to-end test: from `app.projectlumen.io/dashboard/venue/quickplay`, hit "Start the Show" → confirm video plays full-screen on the Pi monitor | Wolsten Studios | 0.5 |
| **Milestone: Stage 1 complete** | Both | — |

### Stage 2 — Projection validation (target: +£1,600, 1 week)

**Goal:** see what a Lumen piece actually looks like projected on a 160×90cm surface from 1.6m height.

| Step | Owner | Days |
|---|---|---|
| Order Stage 2 hardware (BenQ TK700STi projector, light stand, HDMI 2.0 cable, mount bracket) | Wolsten Studios | 0 |
| Build / source a 160×90cm table surface (matte white acrylic or paint sample) | Wolsten Studios | 1 |
| Assemble: stand → projector → HDMI → Pi. Align projection rectangle to the table surface using keystone / lens-shift | Wolsten Studios | 1 |
| Calibrate brightness for typical dim restaurant lighting (test under 100, 300, 500 lux ambient — see § 7) | Wolsten Studios | 1 |
| Record footage of the result for SRS Dynamic to share with prospect venues | Wolsten Studios | 0.5 |
| **Milestone: Stage 2 complete — first physically working Lumen table** | Both | — |

---

## 7. Risks & Open Questions

| # | Risk / Open Question | Mitigation |
|---|---|---|
| 1 | **Throw geometry mismatch.** No off-the-shelf 4K@60fps projector exists at the 0.5 throw ratio our 80cm spec demands. | Stage 2 uses BenQ TK700STi at ~1.0 throw (mount at 1.6m). Phase 3 will spec a custom-optic short-throw projector for production. |
| 2 | **Ambient light vs projector brightness.** Restaurants at dinner-service typically run 50–200 lux. Projector brightness vs contrast ratio at that level is the visual quality determinant. | Stage 2 includes a deliberate brightness/lux test. Findings inform production projector spec. |
| 3 | **WiFi sync jitter.** If a venue insists on wireless tables (no cable runs), multi-table sync degrades. | Strongly recommend wired ethernet in venue contracts. WiFi is fallback only and may produce visible drift. |
| 4 | **Pi 5 thermal under sustained 4K playback.** 24/7 4K HLS decode generates heat. | Argon NEO 5 passive heatsink case rated for this load. Monitor temps during Stage 2 burn-in. |
| 5 | ~~Lumen Player not yet built.~~ **Resolved:** player implemented at `lumen-player/` (~80% complete). Remaining gaps: status heartbeat, TLS for `wss:` from HTTPS dashboards. | Finish remaining gaps during Stage 1 bench testing. |
| 6 | **Supabase service key on Pi.** Each Pi would need a service-role key to update its `tables.status` — sharing that key with field devices is a security concern. | Phase 2/3: replace with a dedicated low-privilege Supabase JWT minted per table, or proxy status updates through the Lumen app server. Out of scope for prototype. |
| 7 | **Projector lifespan & cost-per-hour.** BenQ TK700STi lamp life is ~4,000 hours at high brightness — ~3 years of dinner service. Replacement lamps £200. Production projector spec should favour laser engines for longer life. | Document in production hardware decision. |
| 8 | **Codec mismatch: Pi 5 has no H.264 hardware decoder, and Mux's standard HLS renditions are H.264.** The Pi 5 only hardware-decodes H.265/HEVC. Software-decoding 4K@60 H.264 on the Pi 5's CPU is at/beyond its limit — expect dropped frames and thermal throttling. | Stage 1 bench test must measure this explicitly. Options if it fails: (a) cap playback at Mux's 1080p rendition (likely fine for a 160×90cm surface viewed at arm's length — projector is the bottleneck anyway), (b) pre-download an H.265 master per show to local storage and loop from disk (also removes internet dependency during service), (c) move to an Intel N100-class mini-PC (~£150) with full H.264/H.265 hardware decode. Decision gate at end of Stage 1. |
| 9 | **Mixed-content block: HTTPS dashboard → `ws://` table.** Browsers block insecure WebSocket connections from HTTPS pages. The production dashboard at `app.projectlumen.io` is HTTPS, so the iPad's browser will refuse `ws://<table-ip>:8765`, and `wss://` requires a TLS cert the Pi doesn't have. | Stage 1: test from a local HTTP dev build, or use Safari's per-site insecure-content allowance. Production options: local reverse proxy with venue-domain cert on each Pi, or a packaged iPad app (WKWebView/native — not subject to mixed-content rules). Must be resolved before any venue pilot. |

---

## 8. Procurement Checklist (Stage 1 + Stage 2)

Order all in a single procurement to minimise delivery delays:

- [ ] **Raspberry Pi 5 (8GB)** — *The Pi Hut, Pimoroni, ThePiHut.com*
- [ ] **Official Pi 5 27W USB-C power supply (UK 3-pin)**
- [ ] **SanDisk Extreme 64GB microSDXC A2 V30**
- [ ] **Argon NEO 5 case for Pi 5**
- [ ] **Micro-HDMI to HDMI 2.0 cable, 1m** (note: NOT micro-USB; check Pi 5 port shape)
- [ ] **Cat6 ethernet cable, 2m**
- [ ] **LG 27UP650-W 4K monitor** *(Stage 1 — or borrow an existing 4K@60Hz TV/monitor)*
- [ ] **BenQ TK700STi 4K projector** *(Stage 2)*
- [ ] **Light stand with overhead boom arm** *(Stage 2)*
- [ ] **HDMI 2.0 cable, 5m** *(Stage 2 — for projector run)*
- [ ] **Matte white acrylic / paint sample sheet 160×90cm** *(Stage 2 — table surface)*

Estimated total Stage 1 + 2: **~£1,680 + monitor (~£270) ≈ £1,950 all-in.**

---

## 9. Next Steps

1. **Sign-off this document** with SRS Dynamic (Noel) — confirms hardware spend authorisation
2. **Place Stage 1 order** — Pi 5 kit + monitor (~£420)
3. **Lumen Player is already built** (`lumen-player/` in the main repo) — finish status heartbeat + TLS plan while hardware ships
4. **Pi 5 arrives → flash → deploy Lumen Player → end-to-end test from production iPad app** — Stage 1 milestone (includes the H.264 decode benchmark, risk #8)
5. **Place Stage 2 order** — BenQ projector + stand + cabling (~£1,160)
6. **Assemble the table** — first physical Lumen table running on the bench
7. **Record demo footage + integrate findings** into SRS Dynamic's pitch deck and the Phase 3 production hardware spec

---

## 10. Sign-Off

Signature confirms agreement on the hardware spend, the Lumen Player architecture, and the two-stage build plan.

**Wolsten Studios LTD**
Name: Dan Wolstenholme
Signature: ___________________________
Date: ___________________________

**SRS Dynamic**
Name: Noel [SURNAME]
Signature: ___________________________
Date: ___________________________

---

<!--
  [ replace this comment block with Wolsten Studios brand footer ]
-->

*This document is confidential. © Wolsten Studios LTD 2026. All rights reserved.*
