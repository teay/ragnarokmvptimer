#!/bin/bash
# Post-build optimization for lite build

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
HTML="$PROJECT_DIR/dist/index.html"

if [ -f "$HTML" ]; then
  # Remove modulepreload for firebase (should be lazy, not preload)
  sed -i '/<link rel="modulepreload".*firebase/d' "$HTML"
  echo "Removed firebase modulepreload from index.html"
fi
