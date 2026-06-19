#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/sononet/SonoNet64.pth"
if [[ -f "$DEST" ]]; then
  echo "OK: $DEST already exists ($(du -h "$DEST" | cut -f1))"
  exit 0
fi
echo "Downloading SonoNet64.pth (~120MB)..."
curl -fL --retry 3 --connect-timeout 30 \
  "https://github.com/rdroste/SonoNet_PyTorch/raw/master/sononet/SonoNet64.pth" \
  -o "$DEST"
echo "Saved: $DEST"
