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

# Create destination directories
mkdir -p "$DEST_MAPS"
mkdir -p "$DEST_ICONS"

# Copy all map PNGs
cp "$SRC_MAPS"/*.png "$DEST_MAPS/" 2>/dev/null || true
echo "Copied $(ls "$DEST_MAPS"/*.png 2>/dev/null | wc -l) map images to public/maps/"

# Copy all MVP icon PNGs
cp "$SRC_ICONS"/*.png "$DEST_ICONS/" 2>/dev/null || true
echo "Copied $(ls "$DEST_ICONS"/*.png 2>/dev/null | wc -l) MVP icons to public/icons/"

# Overlay animated icons (APNG + GIF) on top of static icons
SRC_ANIMATED="$PROJECT_DIR/src/assets/mvp_icons_animated"
cp "$SRC_ANIMATED"/*.png "$DEST_ICONS/" 2>/dev/null || true
cp "$SRC_ANIMATED"/*.gif "$DEST_ICONS/" 2>/dev/null || true
echo "Overlaid $(ls "$SRC_ANIMATED"/*.png "$SRC_ANIMATED"/*.gif 2>/dev/null | wc -l) animated icons"

# Compress images with Python/PIL
DEST_MAPS="$DEST_MAPS" DEST_ICONS="$DEST_ICONS" python3 << 'PYEOF'
import os
from PIL import Image

maps_dir = os.environ.get("DEST_MAPS", "")
icons_dir = os.environ.get("DEST_ICONS", "")

def compress_dir(directory, ext, colors):
    count = 0
    for f in sorted(os.listdir(directory)):
        if not f.endswith(ext):
            continue
        path = os.path.join(directory, f)
        try:
            if ext == '.gif':
                img = Image.open(path)
                frames = []
                for i in range(getattr(img, 'n_frames', 1)):
                    img.seek(i)
                    frames.append(img.convert('RGBA').quantize(colors=colors, method=Image.Quantize.FASTOCTREE))
                frames[0].save(path, save_all=True, append_images=frames[1:],
                               duration=img.info.get('duration', 100), loop=0, optimize=True)
            else:
                img = Image.open(path)
                img = img.quantize(colors=colors, method=Image.Quantize.FASTOCTREE)
                img.save(path, optimize=True)
            count += 1
        except:
            pass
    return count

if maps_dir:
    n = compress_dir(maps_dir, '.png', 128)
    print(f"Compressed {n} map images")
if icons_dir:
    n1 = compress_dir(icons_dir, '.png', 64)
    n2 = compress_dir(icons_dir, '.gif', 64)
    print(f"Compressed {n1} icon PNGs + {n2} GIFs")
PYEOF

echo "Assets ready for lite build!"
