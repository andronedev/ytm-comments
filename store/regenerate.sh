#!/usr/bin/env bash
# Regenerate all PNG assets from the SVG and HTML sources in this directory.
# Requires Google Chrome installed at the standard macOS path.

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

if [ ! -x "$CHROME" ]; then
  echo "Chrome not found at $CHROME" >&2
  exit 1
fi

cd "$DIR"

# Icon at 16/32/48/96/128
for size in 16 32 48 96 128; do
  wrap="_icon-wrap-${size}.html"
  cat > "$wrap" <<EOF
<!doctype html>
<html><head><style>html,body{margin:0;padding:0;background:transparent;width:${size}px;height:${size}px;overflow:hidden}img{display:block;width:${size}px;height:${size}px}</style></head>
<body><img src="icon.svg" alt=""></body></html>
EOF
  "$CHROME" --headless=new --hide-scrollbars --disable-gpu --no-sandbox \
    --default-background-color=00000000 \
    --window-size="${size},${size}" \
    --screenshot="$DIR/icon-${size}.png" \
    "file://$DIR/$wrap" >/dev/null 2>&1
  rm "$wrap"
done

# Promo banners
"$CHROME" --headless=new --hide-scrollbars --disable-gpu --no-sandbox \
  --window-size=440,280 \
  --screenshot="$DIR/promo-small.png" \
  "file://$DIR/promo-small.html" >/dev/null 2>&1

"$CHROME" --headless=new --hide-scrollbars --disable-gpu --no-sandbox \
  --window-size=1400,560 \
  --screenshot="$DIR/promo-marquee.png" \
  "file://$DIR/promo-marquee.html" >/dev/null 2>&1

# Sync to the extension's public/icon/
for size in 16 32 48 96 128; do
  cp "$DIR/icon-${size}.png" "$DIR/../public/icon/${size}.png"
done

echo "Assets regenerated:"
ls -1 "$DIR"/*.png
