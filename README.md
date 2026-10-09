# Pomus

A Pomodoro timer for the Linux desktop, in a vintage engraving style. Plain HTML/CSS/JS — no build, no dependencies — run as a small Chrome app window.

## Features
- 25 min focus, 5 min break, 15 min long break every 4 tomatoes (all configurable)
- Optional auto-start breaks (off by default), pause/resume/cancel
- Tick-tock and end-of-cycle alarm, with a mute toggle
- Timeline and stats (last 7 days)
- Tiny mini mode for the timer
- Always-on-top window (X11, via `wmctrl`)
- Timer survives closing and reopening the window
- Data stays local (`localStorage`)

## Requirements
- Google Chrome
- `wmctrl` (optional, for always-on-top; X11 only)

## Run
    ./install.sh      # adds "Pomus" to the applications menu
    ./pomus.sh        # or launch directly

On macOS (Chrome installed; no always-on-top):

    ./install-mac.sh  # builds ~/Applications/Pomus.app and pins it to the Dock
    ./pomus-mac.sh    # or launch directly

To test quickly: Settings → Focus = 0.1 (6 seconds).

## Files
- `index.html`, `style.css`, `app.js` — the app
- `art/` — original SVG illustrations
- `pomus.sh` — launcher (window size, always on top)
- `pomus-mac.sh` — macOS launcher
- `install-mac.sh` — builds `Pomus.app` for the macOS Dock
- `install.sh` — creates the `.desktop` entry

## License
MIT
