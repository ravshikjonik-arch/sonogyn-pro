#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ICON="$ROOT/assets/icon.png"
OUT="$ROOT/public"
mkdir -p "$OUT"
if [[ ! -f "$ICON" ]]; then
  echo "Missing $ICON" >&2
  exit 1
fi
sips -z 192 192 "$ICON" --out "$OUT/icon-192.png" >/dev/null
sips -z 512 512 "$ICON" --out "$OUT/icon-512.png" >/dev/null
sips -z 180 180 "$ICON" --out "$OUT/apple-touch-icon.png" >/dev/null
echo "PWA icons written to $OUT"
