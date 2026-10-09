#!/usr/bin/env bash
# Builds ~/Applications/Pomus.app from the Electron runtime and pins it to the Dock.
# Re-run after pulling changes: the app code is copied into the bundle.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
APP="$HOME/Applications/Pomus.app"
(cd "$DIR" && npm install --no-fund --no-audit)

mkdir -p "$HOME/Applications"
rm -rf "$APP"
cp -R "$DIR/node_modules/electron/dist/Electron.app" "$APP"

# app code
RES="$APP/Contents/Resources"
mkdir -p "$RES/app"
cp -R "$DIR"/{package.json,main.js,preload.js,index.html,style.css,app.js,art} "$RES/app/"

# name and identity
PL="$APP/Contents/Info.plist"
plutil -replace CFBundleName -string Pomus "$PL"
plutil -replace CFBundleDisplayName -string Pomus "$PL"
plutil -replace CFBundleIdentifier -string com.marcioalexbarbosa.pomus "$PL"

# icon: art/icon.png -> electron.icns (the name Info.plist already points to)
SET="$(mktemp -d)/Pomus.iconset"
mkdir -p "$SET"
for s in 16 32 128 256 512; do
  sips -z $s $s "$DIR/art/icon.png" --out "$SET/icon_${s}x${s}.png" >/dev/null
  sips -z $((s*2)) $((s*2)) "$DIR/art/icon.png" --out "$SET/icon_${s}x${s}@2x.png" >/dev/null
done
iconutil -c icns "$SET" -o "$RES/electron.icns"

# the bundle changed, so re-sign it (ad hoc) or macOS refuses to open it
xattr -cr "$APP"
codesign --force --deep --sign - "$APP"
touch "$APP"

# pin to the Dock (once)
if ! defaults read com.apple.dock persistent-apps 2>/dev/null | grep -q "Pomus.app"; then
  defaults write com.apple.dock persistent-apps -array-add \
    "<dict><key>tile-data</key><dict><key>file-data</key><dict><key>_CFURLString</key><string>file://$APP/</string><key>_CFURLStringType</key><integer>15</integer></dict></dict></dict>"
  killall Dock
fi
echo "Installed: $APP"
