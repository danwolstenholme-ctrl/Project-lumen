# Laptop + iPad + Projector Test

Use this when a laptop is standing in for the table-mounted mini PC. The laptop
runs `lumen-player`, the projector is the HDMI output, and the iPad runs the
venue Quick Play dashboard.

## What this proves

- iPad Quick Play can publish table commands through Supabase Realtime.
- The table player can receive those commands over outbound internet.
- The player can fetch a Mux HLS asset and render it full-screen.
- Table status flows back to the venue dashboard.

This is a software and control-path test. It does not validate Pi 5 decode
performance, projector throw geometry, mounting stability, or restaurant network
conditions.

## Required setup

- A venue-role account in Clerk.
- A venue row with at least one table row.
- At least one licensed, published show with `mux_playback_id`.
- Supabase Realtime enabled for the `tables` table, per `LUMEN_SCHEMA.sql`.
- macOS laptop with internet access.
- Projector connected to the laptop over HDMI/USB-C.
- iPad signed into the venue account at `https://app.projectlumen.io` or pointed
  at the laptop's local dev server.

For demo data, use the existing seed script after creating artist and venue
Clerk accounts:

```bash
npm run seed -- --artist=artist@example.com --venue=venue@example.com
```

The seed script creates published Mux-ready demo shows, licenses them to the
venue, and creates table rows.

## 1. Copy the table player ID

Open the venue Tables page:

```text
/dashboard/venue/tables
```

Copy the table's **Player ID**. This is the `tables.id` UUID and becomes
`TABLE_ID` for the laptop player.

If the deployed app does not show Player ID yet, copy the `id` directly from
the `tables` row in Supabase.

## 2. Install local player dependencies

On the laptop:

```bash
brew install mpv python@3.11
cd lumen-player
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 3. Export player environment

Use the same Supabase project as the app the iPad will control:

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-role-key"
export TABLE_ID="the-table-player-id"
export LOG_LEVEL=INFO
```

Optional: if the full-screen mpv window appears on the laptop instead of the
projector, try one of these and restart the player:

```bash
export MPV_FULLSCREEN_SCREEN=0
# or
export MPV_FULLSCREEN_SCREEN=1
```

Keep the service-role key on the laptop only. Do not put it in browser code or
share it with the iPad.

## 4. Arrange the projector

In macOS System Settings:

- Use the projector as a separate display if you want the laptop screen free for
  logs.
- Set the projector resolution to 3840 x 2160 at 60 Hz if available.
- If mpv opens on the wrong screen, use `MPV_FULLSCREEN_SCREEN` or temporarily
  make the projector the main display.

## 5. Start the laptop player

```bash
python -m lumen_player
```

Expected signs:

- mpv opens a black full-screen window.
- Logs show a Supabase Realtime subscription to `table:<TABLE_ID>`.
- The table row flips from `offline` to `online_idle`.
- Quick Play shows the table as online.

## 6. Drive it from the iPad

On the iPad:

1. Open `/dashboard/venue/quickplay`.
2. Confirm the table is online.
3. Choose a default show if needed.
4. Tap **Start the Show**.
5. Confirm video appears through the projector.
6. Tap **Stop All Tables** and confirm playback stops.

## Local dev app on the iPad

If you want the iPad to hit your local Next dev server instead of production:

```bash
npm run dev -- --hostname 0.0.0.0
```

Find the laptop's LAN IP, then open this on the iPad:

```text
http://<laptop-lan-ip>:3000/dashboard/venue/quickplay
```

The iPad and laptop must be on the same LAN for this local web-app path. The
player command path itself still goes through Supabase.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Table remains offline | Wrong `TABLE_ID`, wrong Supabase key, or player not running | Check player logs and confirm the `tables.id` UUID |
| Quick Play has no Start button | No licensed published shows for the venue | License a published show or run the seed script |
| Player says `show not playable` | The show has no `mux_playback_id` | Use a Mux-ready published show |
| mpv opens on laptop screen | Wrong full-screen target | Try `MPV_FULLSCREEN_SCREEN=0` or `1`, or make the projector the main display |
| Video does not play | Network cannot reach Mux, or mpv cannot decode/render | Test the HLS URL in mpv directly and check projector resolution |
| iPad cannot open local dev URL | Local dev server bound to localhost or devices are on different networks | Start dev with `--hostname 0.0.0.0` and use the laptop LAN IP |
