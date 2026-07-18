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
