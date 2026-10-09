#!/usr/bin/env bash
# Installs a "Pomus" launcher in the applications menu.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
(cd "$DIR" && npm install --no-fund --no-audit)
APPS="$HOME/.local/share/applications"
mkdir -p "$APPS"
cat > "$APPS/pomus.desktop" <<DESK
[Desktop Entry]
Type=Application
Name=Pomus
Comment=Pomodoro timer
Exec=$DIR/pomus.sh
Icon=$DIR/art/icon.png
Terminal=false
Categories=Utility;Office;
StartupWMClass=pomus
DESK
update-desktop-database "$APPS" 2>/dev/null || true
echo "Installed: $APPS/pomus.desktop"
