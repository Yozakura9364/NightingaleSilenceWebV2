#!/usr/bin/env bash
set -euo pipefail

SERVICE_USER="nsglamour-reader"
INSTALL_ROOT="/opt/nsglamour-risingstones-reader"
STATE_ROOT="/var/lib/nsglamour-risingstones-reader"
CONFIG_ROOT="/etc/nsglamour-risingstones-reader"
LISTEN_HOST=""
TOKEN_FILE=""
BROWSER_PATH="/snap/chromium/current/usr/lib/chromium-browser/chrome"
DEVTOOLS_PORT="18766"

usage() {
  printf '%s\n' "Usage: $0 --listen-host <tailscale-ip> --token-file <path> [--browser-path <path>]"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --listen-host) LISTEN_HOST="$2"; shift 2 ;;
    --token-file) TOKEN_FILE="$2"; shift 2 ;;
    --browser-path) BROWSER_PATH="$2"; shift 2 ;;
    --devtools-port) DEVTOOLS_PORT="$2"; shift 2 ;;
    *) usage; exit 2 ;;
  esac
done

if [[ $EUID -ne 0 || -z "$LISTEN_HOST" || -z "$TOKEN_FILE" ]]; then
  usage
  exit 2
fi

for command in node Xvfb "$BROWSER_PATH"; do
  command -v "$command" >/dev/null 2>&1 || { printf 'Missing command: %s\n' "$command" >&2; exit 1; }
done
[[ -f "$TOKEN_FILE" ]] || { printf 'Token file not found\n' >&2; exit 1; }

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
id -u "$SERVICE_USER" >/dev/null 2>&1 || useradd --system --home-dir "$STATE_ROOT" --shell /usr/sbin/nologin "$SERVICE_USER"

install -d -o root -g root -m 0755 "$INSTALL_ROOT"
install -d -o "$SERVICE_USER" -g "$SERVICE_USER" -m 0700 "$STATE_ROOT"
install -d -o root -g "$SERVICE_USER" -m 0750 "$CONFIG_ROOT"
install -o root -g root -m 0755 "$SCRIPT_DIR/risingstones-reader.js" "$INSTALL_ROOT/risingstones-reader.js"
chown root:"$SERVICE_USER" "$TOKEN_FILE"
chmod 0640 "$TOKEN_FILE"

cat > "$CONFIG_ROOT/config.json" <<EOF
{
  "listenHost": "$LISTEN_HOST",
  "listenPort": 18770,
  "devToolsPort": $DEVTOOLS_PORT,
  "edgePath": "$BROWSER_PATH",
  "profileDir": "$STATE_ROOT/chromium-profile",
  "tokenFile": "$TOKEN_FILE",
  "qrPath": "$STATE_ROOT/login-qr.png",
  "logPath": "$STATE_ROOT/reader.log"
}
EOF
chown root:"$SERVICE_USER" "$CONFIG_ROOT/config.json"
chmod 0640 "$CONFIG_ROOT/config.json"

cat > /etc/systemd/system/nsglamour-risingstones-reader-xvfb.service <<'EOF'
[Unit]
Description=Virtual display for NSGlamour Rising Stones Reader

[Service]
Type=simple
User=nsglamour-reader
Group=nsglamour-reader
ExecStart=/usr/bin/Xvfb :99 -screen 0 1280x800x24 -nolisten tcp
Restart=on-failure
RestartSec=2
NoNewPrivileges=true
ProtectHome=true
ProtectSystem=full

[Install]
WantedBy=multi-user.target
EOF

install -o root -g root -m 0644 "$SCRIPT_DIR/nsglamour-risingstones-reader.service" /etc/systemd/system/nsglamour-risingstones-reader.service
systemctl daemon-reload
systemctl enable --now nsglamour-risingstones-reader-xvfb.service nsglamour-risingstones-reader.service
