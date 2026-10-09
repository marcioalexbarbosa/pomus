#!/usr/bin/env bash
# Opens Pomus as a small Chrome app window that stays on top (X11, needs wmctrl).
DIR="$(cd "$(dirname "$0")" && pwd)"
google-chrome --app="file://$DIR/index.html" --window-size=350,550 \
  --user-data-dir="$HOME/.config/pomus-chrome" --class=pomus \
  --autoplay-policy=no-user-gesture-required &
PID=$!
# wait for the window, then set size and "above"
for _ in $(seq 1 50); do
  ids=$(wmctrl -lx | awk '$3 ~ /\.pomus$/ {print $1}')
  if [ -n "$ids" ]; then
    for id in $ids; do
      wmctrl -i -r "$id" -e 0,-1,-1,350,550
      wmctrl -i -r "$id" -b add,above
    done
    break
  fi
  sleep 0.2
done
wait $PID
