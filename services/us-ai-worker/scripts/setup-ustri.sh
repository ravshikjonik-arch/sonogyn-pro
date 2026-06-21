#!/usr/bin/env bash
# USTri code + USpec.pth for Railway/production (MacDunno/USTri ISBI 2026).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
USTRI_DIR="${USTRI_PATH:-$ROOT/ustri}"
WEIGHTS="${USTRI_USPEC_WEIGHTS:-$USTRI_DIR/USpec.pth}"
REPO="${USTRI_GIT_REPO:-https://github.com/MacDunno/USTri.git}"
GDRIVE_ID="${USTRI_GDRIVE_ID:-1koHfqj1ih8qb9nhd5u8h7ViIDkSayaic}"

if [[ "${INSTALL_USTRI:-1}" != "1" ]]; then
  echo "SKIP: INSTALL_USTRI=${INSTALL_USTRI:-0}"
  exit 0
fi

if [[ ! -d "$USTRI_DIR/.git" ]] && [[ ! -f "$USTRI_DIR/model_factory.py" ]]; then
  echo "Cloning USTri (shallow) → $USTRI_DIR"
  rm -rf "$USTRI_DIR"
  git clone --depth 1 "$REPO" "$USTRI_DIR"
fi

if [[ -f "$WEIGHTS" ]]; then
  echo "OK: USpec.pth already exists ($(du -h "$WEIGHTS" | cut -f1))"
  exit 0
fi

echo "Downloading USpec.pth (~1.2GB) from Google Drive..."
mkdir -p "$(dirname "$WEIGHTS")"

if command -v gdown >/dev/null 2>&1; then
  gdown "$GDRIVE_ID" -O "$WEIGHTS" --fuzzy
elif python3 -c "import gdown" 2>/dev/null; then
  python3 -m gdown "$GDRIVE_ID" -O "$WEIGHTS" --fuzzy
else
  pip install --no-cache-dir gdown
  gdown "$GDRIVE_ID" -O "$WEIGHTS" --fuzzy
fi

if [[ ! -s "$WEIGHTS" ]]; then
  echo "ERROR: USpec.pth download failed or empty" >&2
  exit 1
fi

echo "Saved: $WEIGHTS ($(du -h "$WEIGHTS" | cut -f1))"
