#!/usr/bin/env bash
# Launches Pomus (Electron). Installs dependencies on first run.
DIR="$(cd "$(dirname "$0")" && pwd)"
[ -x "$DIR/node_modules/.bin/electron" ] || (cd "$DIR" && npm install --no-fund --no-audit)
exec "$DIR/node_modules/.bin/electron" "$DIR" "$@"
