#!/bin/bash
# Script to copy map images and icons to public/ for lite build
# Run before `npm run build:lite`

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SRC_MAPS="$PROJECT_DIR/src/assets/mvp_maps"
SRC_ICONS="$PROJECT_DIR/src/assets/mvp_icons"
DEST_MAPS="$PROJECT_DIR/public/maps"
DEST_ICONS="$PROJECT_DIR/public/icons"

echo "Preparing lite build assets..."

# Save favicon files (they live in public/icons/ but aren't MVP icons)
FAVICON_DIR="$PROJECT_DIR/public/_favicons"
mkdir -p "$FAVICON_DIR"
for f in apple-touch-icon.png favicon-32x32.png favicon-16x16.png; do
  [ -f "$DEST_ICONS/$f" ] && cp "$DEST_ICONS/$f" "$FAVICON_DIR/" 2>/dev/null || true
done

# Clean old public assets
rm -rf "$DEST_MAPS" "$DEST_ICONS"
mkdir -p "$DEST_MAPS" "$DEST_ICONS" "$DEST_ICONS/anim"

# Copy all map PNGs
cp "$SRC_MAPS"/*.png "$DEST_MAPS/" 2>/dev/null || true
echo "Copied $(ls "$DEST_MAPS"/*.png 2>/dev/null | wc -l) map images to public/maps/"

# Copy all static MVP icon PNGs
cp "$SRC_ICONS"/*.png "$DEST_ICONS/" 2>/dev/null || true
echo "Copied $(ls "$DEST_ICONS"/*.png 2>/dev/null | wc -l) static MVP icons to public/icons/"

# Copy animated icons
SRC_ANIMATED="$PROJECT_DIR/src/assets/mvp_icons_animated"
# GIFs: different extension, no conflict with static PNGs
cp "$SRC_ANIMATED"/*.gif "$DEST_ICONS/" 2>/dev/null || true
# APNGs: same extension as static, put in anim/ subdirectory
cp "$SRC_ANIMATED"/*.png "$DEST_ICONS/anim/" 2>/dev/null || true
echo "Overlaid $(ls "$SRC_ANIMATED"/*.png "$SRC_ANIMATED"/*.gif 2>/dev/null | wc -l) animated icons"

# Copy server data JSON files
DEST_DATA="$PROJECT_DIR/public/data"
mkdir -p "$DEST_DATA"
cp "$PROJECT_DIR/src/data/"*.json "$DEST_DATA/" 2>/dev/null || true
echo "Copied $(ls "$DEST_DATA"/*.json 2>/dev/null | wc -l) server data files to public/data/"

# Compress only STATIC images (maps + static PNGs)
# Do NOT compress animated APNGs or GIFs - they have transparency and animation
python3 - "$DEST_MAPS" "$DEST_ICONS" << 'PYEOF'
import os, sys
from PIL import Image

maps_dir = sys.argv[1]
icons_dir = sys.argv[2]

# Compress map PNGs (lossy, no transparency)
count = 0
for f in sorted(os.listdir(maps_dir)):
    if not f.endswith('.png'):
        continue
    path = os.path.join(maps_dir, f)
    try:
        img = Image.open(path)
        img = img.quantize(colors=128, method=Image.Quantize.FASTOCTREE)
        img.save(path, optimize=True)
        count += 1
    except:
        pass
print(f"Compressed {count} map images")

# Compress static icon PNGs only (skip anim/ subdirectory and .gif files)
count = 0
for f in sorted(os.listdir(icons_dir)):
    if not f.endswith('.png'):
        continue
    path = os.path.join(icons_dir, f)
    try:
        img = Image.open(path)
        img = img.quantize(colors=64, method=Image.Quantize.FASTOCTREE)
        img.save(path, optimize=True)
        count += 1
    except:
        pass
print(f"Compressed {count} static icon PNGs")
print(f"Skipped animated icons in anim/ (APNG preserved)")
print(f"Skipped animated icons *.gif (GIF preserved)")
PYEOF

echo "Assets ready for lite build!"

# Restore favicon files
if [ -d "$FAVICON_DIR" ]; then
  cp "$FAVICON_DIR"/* "$DEST_ICONS/" 2>/dev/null || true
  rm -rf "$FAVICON_DIR"
  echo "Restored favicon files"
fi
