#!/usr/bin/env bash
#
# Lumen Player installer for Raspberry Pi OS Lite (64-bit, Bookworm).
#
# Run from the lumen-player directory on the Pi:
#   sudo ./scripts/install.sh
#
set -euo pipefail

if [ "$EUID" -ne 0 ]; then
  echo "error: must run as root (try: sudo $0)"
  exit 1
fi

INSTALL_DIR=/opt/lumen-player
CONFIG_DIR=/etc/lumen-player
SERVICE_USER=lumen
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> installing system packages"
apt-get update
apt-get install -y python3 python3-pip python3-venv mpv ca-certificates

echo "==> creating service user"
if ! id -u "$SERVICE_USER" >/dev/null 2>&1; then
  useradd -r -m -s /usr/sbin/nologin -G video,render "$SERVICE_USER"
fi

echo "==> staging files in $INSTALL_DIR"
mkdir -p "$INSTALL_DIR" "$CONFIG_DIR"
cp -r "$SCRIPT_DIR/lumen_player" "$INSTALL_DIR/"
cp "$SCRIPT_DIR/requirements.txt" "$INSTALL_DIR/"
chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"

echo "==> installing Python dependencies"
python3 -m venv "$INSTALL_DIR/.venv"
"$INSTALL_DIR/.venv/bin/pip" install --quiet --upgrade pip
"$INSTALL_DIR/.venv/bin/pip" install --quiet -r "$INSTALL_DIR/requirements.txt"

echo "==> installing systemd unit"
cp "$SCRIPT_DIR/systemd/lumen-player.service" /etc/systemd/system/lumen-player.service
systemctl daemon-reload

if [ ! -f "$CONFIG_DIR/env" ]; then
  echo "==> seeding $CONFIG_DIR/env from env.example (edit before starting)"
  cp "$SCRIPT_DIR/env.example" "$CONFIG_DIR/env"
  chmod 600 "$CONFIG_DIR/env"
  chown root:root "$CONFIG_DIR/env"
fi

systemctl enable lumen-player

cat <<EOF

Install complete.

Next steps:
  1. Fill in credentials:   sudo nano $CONFIG_DIR/env
  2. Create a tables row in Supabase if not done, paste its UUID into TABLE_ID
  3. Start the service:     sudo systemctl start lumen-player
  4. Tail the log:          sudo journalctl -u lumen-player -f

EOF
