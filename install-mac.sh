#!/usr/bin/env bash
# Builds ~/Applications/Pomus.app (launches pomus-mac.sh) and pins it to the Dock.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
APP="$HOME/Applications/Pomus.app"
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"

cat > "$APP/Contents/MacOS/Pomus" <<SH
#!/usr/bin/env bash
exec "$DIR/pomus-mac.sh"
SH
chmod +x "$APP/Contents/MacOS/Pomus"

cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleName</key><string>Pomus</string>
  <key>CFBundleDisplayName</key><string>Pomus</string>
  <key>CFBundleIdentifier</key><string>com.marcioalexbarbosa.pomus</string>
  <key>CFBundleExecutable</key><string>Pomus</string>
  <key>CFBundleIconFile</key><string>Pomus</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>1.0</string>
</dict></plist>
PLIST

# icon: art/icon.png -> Pomus.icns
SET="$(mktemp -d)/Pomus.iconset"
mkdir -p "$SET"
for s in 16 32 128 256 512; do
  sips -z $s $s "$DIR/art/icon.png" --out "$SET/icon_${s}x${s}.png" >/dev/null
  sips -z $((s*2)) $((s*2)) "$DIR/art/icon.png" --out "$SET/icon_${s}x${s}@2x.png" >/dev/null
done
iconutil -c icns "$SET" -o "$APP/Contents/Resources/Pomus.icns"
touch "$APP"

# pin to the Dock (once)
if ! defaults read com.apple.dock persistent-apps 2>/dev/null | grep -q "Pomus.app"; then
  defaults write com.apple.dock persistent-apps -array-add \
    "<dict><key>tile-data</key><dict><key>file-data</key><dict><key>_CFURLString</key><string>file://$APP/</string><key>_CFURLStringType</key><integer>15</integer></dict></dict></dict>"
  killall Dock
fi
echo "Installed: $APP"
