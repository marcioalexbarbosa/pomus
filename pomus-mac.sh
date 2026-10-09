#!/usr/bin/env bash
# Opens Pomus as a small Chrome app window on macOS.
DIR="$(cd "$(dirname "$0")" && pwd)"
open -na "Google Chrome" --args --app="file://$DIR/index.html" --window-size=350,550 \
  --user-data-dir="$HOME/Library/Application Support/pomus-chrome" \
  --autoplay-policy=no-user-gesture-required
