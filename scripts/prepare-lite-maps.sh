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

echo "Assets ready for lite build!"
