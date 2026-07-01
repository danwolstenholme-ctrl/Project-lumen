# First-time Raspberry Pi 5 setup for Lumen Player

End-to-end procedure to take a brand-new Pi 5 from box to "playing Lumen content from the iPad". Approximately 30 minutes total.

## 1. Flash the SD card

Use [Raspberry Pi Imager](https://www.raspberrypi.com/software/) on your laptop:

- **Device:** Raspberry Pi 5
- **OS:** Raspberry Pi OS Lite (64-bit), Bookworm
- **Storage:** the 64GB+ A2 microSD

Before writing, click the gear icon (OS customisation):
- **Hostname:** `lumen-table-1` (or per-venue convention)
- **Username + password:** `pi` / something secure
- **Enable SSH:** with password OR public key (PK preferred)
- **Wi-Fi:** optional — wired ethernet strongly preferred
- **Locale / timezone:** match the venue

Write. Eject. Insert into the Pi.

## 2. First boot

Connect to the Pi:

```bash
# From your laptop, find the Pi on the LAN
arp -a | grep -i raspberry
# or use your router's connected-devices view

ssh pi@<pi-ip>
```

Update everything:

```bash
sudo apt update && sudo apt full-upgrade -y
sudo reboot
```

## 3. Copy this directory to the Pi

From your laptop, in the parent directory of `lumen-player/`:

```bash
scp -r lumen-player pi@<pi-ip>:~/
```

## 4. Install

SSH in and run the installer:

```bash
ssh pi@<pi-ip>
cd ~/lumen-player
sudo ./scripts/install.sh
```

The installer creates the `lumen` service user, sets up a virtualenv at `/opt/lumen-player/.venv`, installs the systemd unit, and copies the env template into `/etc/lumen-player/env`.

## 5. Configure

Open the env file:

```bash
sudo nano /etc/lumen-player/env
```

Fill in:

- `SUPABASE_URL` — from Supabase dashboard → Settings → API
- `SUPABASE_SERVICE_KEY` — same page, the *service role* key (not anon)
- `TABLE_ID` — see step 6

## 6. Create a row in Supabase for this table

In the Supabase SQL editor:

```sql
INSERT INTO tables (venue_id, label, ip_address, status)
VALUES (
  '<your-venue-uuid>',
  'Table 1',
  '<this-pi-lan-ip>',
  'offline'
)
RETURNING id;
```

Paste the returned `id` into `TABLE_ID` in `/etc/lumen-player/env`.

## 7. Start the service

```bash
sudo systemctl start lumen-player
sudo journalctl -u lumen-player -f
```

Expected log lines:

```
... INFO lumen_player | starting Lumen Player for table <uuid>
... INFO lumen_player.player | starting mpv...
... INFO lumen_player.player | mpv ready (ipc=/tmp/mpv-lumen.sock)
... INFO lumen_player.server | listening on ws://0.0.0.0:8765
```

The HDMI output should now show a black fullscreen mpv window. The table row in Supabase should flip from `offline` → `online_idle`.

## 8. End-to-end smoke test

From a venue-role account in the production app:

1. Open `https://app.projectlumen.io/dashboard/venue/quickplay`
2. Confirm the table chip in the right sidebar shows online (online_idle)
3. Set the default show (any published piece)
4. Tap **Start the Show**

The Pi's HDMI output should display the show, full-screen, looping. The table chip flips to `online_playing`.

If nothing happens, check `sudo journalctl -u lumen-player -f` for errors.

## Troubleshooting

| Symptom | Probable cause | Fix |
|---|---|---|
| `mpv did not create IPC socket within 10s` | mpv missing or failed to start | `sudo apt install mpv`; try `mpv --vo=help` to see available video outputs |
| Black screen, no playback | Show row has no `mux_playback_id` (piece still in `preparing` or `rejected`) | Check the show's `status` and `mux_status` in Supabase |
| `update_table_status failed` | Wrong `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` / `TABLE_ID` | Re-check `/etc/lumen-player/env` |
| Table chip stays offline in app | Player service is not running, or `TABLE_ID` / Supabase credentials are wrong | Check `sudo journalctl -u lumen-player -f` and confirm the `tables.id` UUID |
| Audio out of sync between tables | Buffer fill latency variance | Acceptable for ambient content; frame-exact sync is a Phase 3 refinement |
