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

Each Lumen table is a **self-contained all-in-one unit**: a small networked computer and a downward-facing 4K projector suspended above the table surface on an integrated arm at a fixed throw distance. Nothing is ceiling-mounted or fixed to the venue building — a table is delivered, plugged into mains power and the internet, and works.

Control is **fully cloud-based**: the iPad app (already live at `app.projectlumen.io`) publishes commands through Supabase Realtime channels; each table subscribes to its own channel. There is no iPad↔table LAN dependency. The table fetches video content directly from Mux's HLS CDN — content does not stream through Lumen's app server.

```
┌──────────────────────────────────────────────────────────────────────┐
│                           VENUE PREMISES                             │
│                                                                      │
│   ┌──────────┐          ┌─────────────────────────────────────────┐ │
│   │  iPad    │          │  LUMEN TABLE (all-in-one unit)          │ │
│   │  (Quick  │          │                                         │ │
│   │  Play)   │          │      ┌────────────┐                     │ │
│   └────┬─────┘          │      │ Projector  │ ◄── integrated arm  │ │
│        │                │      │ 4K @ 60Hz  │     at fixed throw  │ │
│        │                │      └─────┬──────┘     distance        │ │
│        │                │            │ projects DOWN              │ │
│        │                │            ▼                            │ │
│        │                │   ╔═══════════════════╗                 │ │
│        │                │   ║  160×90cm matte   ║                 │ │
│        │                │   ║  table surface    ║                 │ │
│        │                │   ╚═══════════════════╝                 │ │
│        │                │      ┌────────────┐                     │ │
│        │                │      │ Pi 5 +     │ ◄── inside the      │ │
│        │                │      │ Lumen      │     table base      │ │
│        │                │      │ Player     │                     │ │
│        │                │      └─────┬──────┘                     │ │
│        │                └────────────┼──────────────────────────  ┘ │
│        │                             │       (× N tables)           │
│        │ HTTPS / WSS                 │ HTTPS / WSS (outbound only)  │
└────────┼─────────────────────────────┼──────────────────────────────┘
         │                             │
         ▼          Internet           ▼
   ┌──────────────────────────────────────────────────────────────┐
   │  Project Lumen Cloud                                         │
   │  ┌─────────────────┐   ┌───────────────┐   ┌──────────────┐  │
   │  │ Vercel (Next.js) │   │  Supabase     │   │  Mux         │  │
   │  │ app.projectlumen │   │  Realtime     │   │  (HLS .m3u8  │  │
   │  │   .io            │   │  (per-table   │   │  video CDN)  │  │
   │  │                 │   │  command      │   │              │  │
   │  │                 │   │  channels +   │   │              │  │
   │  │                 │   │  status rows) │   │              │  │
   │  └─────────────────┘   └───────────────┘   └──────────────┘  │
   └──────────────────────────────────────────────────────────────┘
```

**Key points:**
- **All-in-one table**: projector, support arm, compute, and surface ship as one unit — no ceiling mounts, no venue structural work, no LAN cabling between iPad and tables
- Video bytes flow directly from Mux's CDN to each table — bypassing Lumen's app server for performance and bandwidth efficiency
- **Control is cloud-relayed**: the iPad publishes commands to Supabase Realtime; each table subscribes to its own channel. Both sides connect *outbound* over HTTPS/WSS — no static IPs, no inbound firewall rules, no mixed-content/TLS problem. Command latency ~100–300ms, imperceptible for ambient content.
- Status (`online_playing`, `online_idle`, `offline`) flows back over the same Supabase connection so the iPad dashboard's table chips stay live in real time
- One iPad command + one wall-clock timestamp = all tables play in sync, with no central coordinator

> **Migration note (internal):** the currently deployed dashboard (`QuickPlay.tsx` / `ControlPanel.tsx`) and the current Lumen Player still use direct LAN WebSocket (`ws://<table-ip>:8765`). Cloud control requires (a) the dashboard to publish commands to Supabase Realtime channels instead of opening per-table sockets, and (b) the player to subscribe to its channel instead of running a WS server. Command *payloads* (§ 5.3) are unchanged — only the transport moves. Scheduled before the Stage 1 end-to-end test; the LAN path remains a bench-test fallback.

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

**Path A: Direct projector on integrated table arm (production target)**

The projector hangs above the table surface on a **mount arm integral to the table unit**, at a fixed throw distance set at assembly. No ceiling or building attachment — the table is fully self-contained, even in production.

| Item | Specific product | Quantity | ~Cost (£) | Notes |
|---|---|---|---|---|
| 4K projector | **BenQ TK700STi** | 1 | 1,300 | 4K @ 60Hz native, 3000 lumens, throw ratio 0.9–1.08 |
| Integrated mount arm | Custom steel/aluminium boom arm fixed to table frame, projector cradle at top | 1 | 150–300 | Must hold the projector rigidly at the throw distance (~1.6m for the BenQ — see throw geometry note). Prototype: heavy-duty boom stand bolted to the table base; production: fabricated arm welded/bolted into the table frame. |
| First-surface mirror (optional) | 200×150mm first-surface mirror + custom bracket | 1 | 80 | Mirror folding compresses the arm height — projector mounts lower, beam folds down onto the surface. Likely required for production aesthetics (see throw geometry note). |
| **Display subtotal (path A)** | | | **~1,450–1,680** | |

> ⚠️ **Throw geometry note — critical for the all-in-one design.** Lumen's spec calls for an 80cm arm height projecting 160cm wide — a throw ratio of **0.5**. The 4K@60Hz commodity market has a gap there (ultra-short-throws are too short, standard short-throws are too long). The BenQ TK700STi at ~1.0 throw needs **~1.6m of optical path above the surface**. On an integrated arm that means either (a) a tall arm — visually heavy, sways if knocked, vulnerable in a restaurant, or (b) a **folded optical path**: projector mounted low on the arm firing sideways/up into a first-surface mirror that redirects the beam down — halving apparent arm height. The prototype tests both. **Production will likely need a custom-optic short-throw projector (£4–10k range) to get the arm down to ~80cm** — that procurement is a Phase 3 task and not blocking for prototyping. Stability matters too: an arm-mounted projector must not visibly wobble when the table is bumped — the Stage 2 build must include a knock test.

**Path B: 4K monitor (Stage 1 software-only prototype)**

| Item | Specific product | Quantity | ~Cost (£) | Notes |
|---|---|---|---|---|
| 27" 4K@60Hz monitor | **LG 27UP650-W** (or any 4K@60Hz HDMI 2.0 display) | 1 | 270 | Used face-up to mimic table-surface projection. Validates software pipeline only. |
| **Display subtotal (path B)** | | | **~270** | |

### 3.3 Mounting + physical (Path A only)

The projector is part of the table — held above the surface on an arm that belongs to the unit, never to the building. For the prototype, a height-adjustable boom stand stands in for the production arm while throw geometry is dialled in; once the correct height/offset is known, it's replicated as a fixed fabricated arm in the production table frame.

| Item | Specific product | Quantity | ~Cost (£) | Notes |
|---|---|---|---|---|
| Heavy-duty boom stand (prototype stand-in for the arm) | Manfrotto 1004BAC or equivalent, 3.6m max height | 1 | 130 | Simulates the integrated arm; final arm dimensions taken from this rig |
| Cable management | Generic cable raceway / Velcro ties | — | 15 | Power + HDMI run inside/along the arm in production |

### 3.4 Audio (Phase 3 — Sound Hub)

Audio is **out of scope for the prototype** per the architectural decision recorded in [LUMEN_NEXT.md](LUMEN_NEXT.md) (Sound Hub deferred to Phase 3). The Pi will play audio from the HLS stream over HDMI; in the prototype this audio is muted or routed to a single small speaker. Production venues with the Sound Hub upgrade will run a sibling Pi connected to the venue PA — to be specced separately.

### 3.5 Total per-table cost summary

| Scenario | ~Cost (£) |
|---|---|
| **Stage 1 prototype** (Pi 5 + 4K monitor) | **~420** |
| **Stage 2 prototype** (Pi 5 + BenQ projector + stand + mount) | **~1,680** |
| **Production estimate per table** (compute + production-grade short-throw 4K projector + fabricated integrated arm + table build) | **~£4,000–7,000** (subject to projector selection in Phase 3) |

---

## 4. Networking Architecture

Because control is cloud-relayed, a table's only network requirement is **outbound internet access**. There is no LAN dependency between the iPad and the tables — they don't even need to be on the same network.

### 4.1 Connectivity

Each table connects to the venue's network via **ethernet (preferred) or WiFi**. No static IP, no DHCP reservation, no port forwarding — the table dials out to Supabase and Mux like any other client device. WiFi is acceptable because sync is driven by an absolute wall-clock timestamp (§ 5.4), not by network latency: a command arriving 200ms late on one table still converges to the same playback position.

> **Legacy note:** the `tables.ip_address` column in Supabase was used by the direct-LAN control path and becomes unused once cloud control lands. Tables are identified by their `tables.id` (channel name), not by IP.

### 4.2 Venue network requirements

- A working internet connection with reasonable downstream (see § 4.3)
- Ethernet port near each table if wired (preferred for reliability), or solid WiFi coverage at table locations
- For larger venues: a VLAN segregating Lumen traffic from venue staff/guest WiFi is good practice but not required

### 4.3 Internet bandwidth

Each table's HLS stream from Mux is ~5–15 Mbps for 4K at "plus" quality. A 12-table venue at peak draws ~180 Mbps of internet **downstream**. Most fibre installs in commercial premises are 200/200 or 1000/1000 — should be comfortable. Control traffic via Supabase Realtime is negligible (<1 KB per command).

### 4.4 Outbound firewall

Each Pi needs outbound HTTPS/WSS (port 443) access to:
- `stream.mux.com` (HLS video)
- `image.mux.com` (Mux-generated thumbnails / preview gifs)
- `<project>.supabase.co` (Realtime command channel + REST status updates)

**No inbound connections are needed at all** — the table only ever connects out. This makes the table compatible with any venue firewall/NAT setup with zero configuration.

---

## 5. The Lumen Player

The on-table software. This component **exists in this repo** at `lumen-player/` (Python 3.11, mpv via JSON IPC, ~80% complete — see `lumen-player/README.md`).

### 5.1 What it does

A long-running process on the Pi that:

1. Subscribes to its table's **Supabase Realtime channel** and executes control commands published by the iPad app (current build listens on a local WebSocket `ws://0.0.0.0:8765` instead — see the migration note in § 2; the LAN listener remains as a bench-test fallback)
2. Plays full-screen video on the connected HDMI output
3. Reports its own status (`online_playing`, `online_idle`, `offline`) back to Supabase so the iPad dashboard stays live
4. Survives reboots, network blips, and content changes gracefully

### 5.2 Tech stack (proposed)

| Layer | Choice | Reasoning |
|---|---|---|
| Language | **Python 3.11** | Easy iteration, good libs, runs fine on Pi 5 at this workload |
| Video playback | **mpv** (invoked via IPC) | GPU-accelerated, accepts HLS URLs natively, frame-accurate seek, has a JSON IPC socket for control |
| Command transport | **Supabase Realtime channel subscription** (`realtime-py` / `supabase-py`) | Outbound-only WSS to Supabase — no inbound ports, works behind any NAT. Current build uses `websockets` (Python lib) as a local WS server — kept as bench-test fallback. |
| HTTP client | `httpx` | For Supabase REST calls |
| Process management | `systemd` unit | Auto-restarts on crash, starts on boot, stops cleanly on shutdown |
| OS | **Raspberry Pi OS Lite (64-bit, Bookworm)** | Minimal install, no desktop, fast boot |

### 5.3 Command protocol

Commands sent by iPad → table as JSON payloads. The payload format is transport-independent: identical whether published over a Supabase Realtime channel (production) or a direct WebSocket frame (bench-test fallback).

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

Optional Pi → iPad messages over the same channel:

| Message | Payload | When |
|---|---|---|
| `status` | `{type:"status", state, show_id?, position_ms?}` | On state changes, every 5s while playing |
| `pong` | `{type:"pong", uptime_seconds}` | Response to `ping` |
| `error` | `{type:"error", code, message}` | On failure (network, decode, HDMI lost) |

### 5.4 Sync mechanism

The whole "every table starts the same show at the same instant" effect hinges on a shared wall-clock timestamp.

**At iPad-side (payload as implemented in `QuickPlay.tsx`; transport moving to Supabase Realtime per § 2 migration note):**

```ts
const startAt = Date.now();
tables.forEach(t => {
  publishToChannel(`table:${t.id}`, {
    action: "play",
    show_id: currentShow.id,
    timestamp: startAt,
  });
});
```

**At Pi-side (implemented in `lumen-player/lumen_player/server.py`):**

```python
elapsed_ms = (now_ms() - timestamp) % video_duration_ms
mpv.command("loadfile", hls_url, "replace", { "start": elapsed_ms / 1000 })
```

The mpv `start` option seeks to that position before beginning playback. Because `timestamp` is an absolute wall-clock value, **command delivery latency doesn't matter for sync** — a table receiving the command 300ms later simply seeks 300ms further in. Tables converge to playing the same frame within **~50–150ms** (limited by NTP clock accuracy and mpv seek precision, not by network). That's well below the perception threshold for ambient looping content.

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

**Status (2026-06-10):** the player is built and lives at `lumen-player/` in this repo. The full MVP scope above is implemented, *plus* volume/brightness/pause/resume — but on the LAN WebSocket transport. Remaining before Stage 1 sign-off: 5s status heartbeat while playing, and the **cloud-control migration** (player subscribes to its Supabase Realtime channel; dashboard publishes to it — see § 2 migration note).

---

## 6. Prototype Build Plan

### Stage 1 — Software pipeline validation (target: ~£420, 1 week)

**Goal:** prove that an iPad command can play a Lumen piece on a Pi-driven display.

| Step | Owner | Days |
|---|---|---|
| Order Stage 1 BOM (Pi 5, accessories, microSD, monitor) | Wolsten Studios | 0 (next-day delivery) |
| Flash Raspberry Pi OS Lite (64-bit) to microSD, boot Pi, connect to internet | Wolsten Studios | 0.5 |
| Deploy Lumen Player from `lumen-player/` (already built — see § 5.6) via `scripts/install.sh` + systemd unit | Wolsten Studios | 0.5 |
| Bench-test playback: measure 4K H.264 software-decode performance and Pi temps (risk #8 decision gate) | Wolsten Studios | 1 |
| **Cloud-control migration**: player subscribes to its Supabase Realtime channel; dashboard publishes commands to it (§ 2 migration note) | Wolsten Studios | 1–2 |
| Insert a `tables` row in Supabase; configure Pi credentials for Realtime subscribe + status updates | Wolsten Studios | 0.5 |
| End-to-end test: from `app.projectlumen.io/dashboard/venue/quickplay`, hit "Start the Show" → confirm video plays full-screen on the Pi monitor via the cloud path | Wolsten Studios | 0.5 |
| **Milestone: Stage 1 complete** | Both | — |

### Stage 2 — Projection validation (target: +£1,600, 1 week)

**Goal:** see what a Lumen piece actually looks like projected on a 160×90cm surface from arm height, and validate the all-in-one arm geometry.

| Step | Owner | Days |
|---|---|---|
| Order Stage 2 hardware (BenQ TK700STi projector, boom stand, HDMI 2.0 cable, mount bracket) | Wolsten Studios | 0 |
| Build / source a 160×90cm table surface (matte white acrylic or paint sample) | Wolsten Studios | 1 |
| Assemble: boom stand (arm stand-in) → projector → HDMI → Pi. Align projection rectangle to the table surface using keystone / lens-shift | Wolsten Studios | 1 |
| Dial in arm geometry: record exact height/offset for the production arm spec; test the folded-mirror option to compress arm height | Wolsten Studios | 1 |
| Knock test: confirm projected image stability when the table/rig is bumped (risk #1) | Wolsten Studios | 0.5 |
| Calibrate brightness for typical dim restaurant lighting (test under 100, 300, 500 lux ambient — see § 7) | Wolsten Studios | 1 |
| Record footage of the result for SRS Dynamic to share with prospect venues | Wolsten Studios | 0.5 |
| **Milestone: Stage 2 complete — first physically working Lumen table** | Both | — |

---

## 7. Risks & Open Questions

| # | Risk / Open Question | Mitigation |
|---|---|---|
| 1 | **Throw geometry vs integrated arm.** No off-the-shelf 4K@60fps projector exists at the 0.5 throw ratio our 80cm arm-height spec demands — the BenQ needs ~1.6m of optical path, meaning a tall arm (visually heavy, knock-sensitive) or a folded mirror path. | Stage 2 tests both direct and mirror-folded geometry on the boom-stand rig, including a knock/stability test. Phase 3 will spec a custom-optic short-throw projector to bring the production arm down to ~80cm. |
| 2 | **Ambient light vs projector brightness.** Restaurants at dinner-service typically run 50–200 lux. Projector brightness vs contrast ratio at that level is the visual quality determinant. | Stage 2 includes a deliberate brightness/lux test. Findings inform production projector spec. |
| 3 | ~~WiFi sync jitter.~~ **Largely resolved by cloud control + absolute timestamps.** Sync is computed from a wall-clock timestamp, so command delivery latency (WiFi or cloud) doesn't cause drift. Residual risk: sustained WiFi packet loss can stall the HLS *video* stream itself. | Ethernet still preferred for streaming reliability; WiFi acceptable where coverage is solid. Pre-download/loop-from-disk fallback (risk #8 option b) removes streaming sensitivity entirely. |
| 4 | **Pi 5 thermal under sustained 4K playback.** 24/7 4K HLS decode generates heat. | Argon NEO 5 passive heatsink case rated for this load. Monitor temps during Stage 2 burn-in. |
| 5 | ~~Lumen Player not yet built.~~ **Resolved:** player implemented at `lumen-player/` (~80% complete). Remaining gaps: status heartbeat, cloud-control migration (§ 2). | Finish remaining gaps during Stage 1 bench testing. |
| 6 | **Supabase credentials on Pi.** Under cloud control each Pi needs credentials to subscribe to its Realtime channel and update its `tables.status` — a service-role key on a field device is a security concern, now elevated since the key also grants the command channel. | Prototype: service key acceptable on a benched device. Before any venue pilot: dedicated low-privilege Supabase JWT minted per table (scoped to its own channel + row via RLS), or proxy through the Lumen app server. |
| 7 | **Projector lifespan & cost-per-hour.** BenQ TK700STi lamp life is ~4,000 hours at high brightness — ~3 years of dinner service. Replacement lamps £200. Production projector spec should favour laser engines for longer life. | Document in production hardware decision. |
| 8 | **Codec mismatch: Pi 5 has no H.264 hardware decoder, and Mux's standard HLS renditions are H.264.** The Pi 5 only hardware-decodes H.265/HEVC. Software-decoding 4K@60 H.264 on the Pi 5's CPU is at/beyond its limit — expect dropped frames and thermal throttling. | Stage 1 bench test must measure this explicitly. Options if it fails: (a) cap playback at Mux's 1080p rendition (likely fine for a 160×90cm surface viewed at arm's length — projector is the bottleneck anyway), (b) pre-download an H.265 master per show to local storage and loop from disk (also removes internet dependency during service), (c) move to an Intel N100-class mini-PC (~£150) with full H.264/H.265 hardware decode. Decision gate at end of Stage 1. |
| 9 | ~~Mixed-content block: HTTPS dashboard → `ws://` table.~~ **Resolved by cloud control.** Both the dashboard and the table connect *outbound* to Supabase over `wss:`/HTTPS — no insecure socket, no per-Pi TLS certs, no mixed-content rules triggered. | Carried as resolved; only relevant again if the LAN bench-test fallback is ever used from the HTTPS dashboard (use a local HTTP dev build for bench tests). |
| 10 | **Cloud dependency for control.** If the venue's internet or Supabase goes down, the iPad can't command tables (video would also stall unless pre-downloaded). | Acceptable for ambient content — tables keep looping their current show on connection loss. Pre-download option (risk #8b) makes playback fully offline-tolerant; commands queue/retry on reconnect. |

---

## 8. Procurement Checklist (Stage 1 + Stage 2)

Order all in a single procurement to minimise delivery delays:

- [ ] **Raspberry Pi 5 (8GB)** — *The Pi Hut, Pimoroni, ThePiHut.com*
- [ ] **Official Pi 5 27W USB-C power supply (UK 3-pin)**
- [ ] **SanDisk Extreme 64GB microSDXC A2 V30**
- [ ] **Argon NEO 5 case for Pi 5**
- [ ] **Micro-HDMI to HDMI 2.0 cable, 1m** (note: NOT micro-USB; check Pi 5 port shape)
- [ ] **Cat6 ethernet cable, 2m** *(bench use — production tables can run WiFi or ethernet)*
- [ ] **LG 27UP650-W 4K monitor** *(Stage 1 — or borrow an existing 4K@60Hz TV/monitor)*
- [ ] **BenQ TK700STi 4K projector** *(Stage 2)*
- [ ] **Heavy-duty boom stand** *(Stage 2 — stand-in for the integrated table arm)*
- [ ] **HDMI 2.0 cable, 5m** *(Stage 2 — for projector run up the arm)*
- [ ] **Matte white acrylic / paint sample sheet 160×90cm** *(Stage 2 — table surface)*

Estimated total Stage 1 + 2: **~£1,680 + monitor (~£270) ≈ £1,950 all-in.**

---

## 9. Next Steps

1. **Sign-off this document** with SRS Dynamic (Noel) — confirms hardware spend authorisation
2. **Place Stage 1 order** — Pi 5 kit + monitor (~£420)
3. **Lumen Player is already built** (`lumen-player/` in the main repo) — finish status heartbeat + cloud-control migration (Supabase Realtime transport) while hardware ships
4. **Pi 5 arrives → flash → deploy Lumen Player → end-to-end test from production iPad app via the cloud path** — Stage 1 milestone (includes the H.264 decode benchmark, risk #8)
5. **Place Stage 2 order** — BenQ projector + boom stand + cabling (~£1,600)
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
