#!/usr/bin/env bash
# Shared paths for Colibri sidecar helpers (SonoGyn monorepo).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COLIBRI_HOME="${COLIBRI_HOME:-$HOME/colibri}"
COLI=""
if [[ -x "$COLIBRI_HOME/c/coli" ]]; then
  COLI="$COLIBRI_HOME/c/coli"
elif [[ -x "$COLIBRI_HOME/coli" ]]; then
  COLI="$COLIBRI_HOME/coli"
fi

colibri_python() {
  for c in python3 python; do
    if command -v "$c" >/dev/null 2>&1 && "$c" -c 'import sys; raise SystemExit(0 if sys.version_info >= (3, 10) else 1)' 2>/dev/null; then
      echo "$c"
      return 0
    fi
  done
  return 1
}

require_colibri() {
  if [[ -z "$COLI" ]]; then
    echo "FAIL: Colibri not found at COLIBRI_HOME=$COLIBRI_HOME"
    echo "Clone https://github.com/JustVugg/colibri → ~/colibri (or set COLIBRI_HOME)."
    exit 1
  fi
  if ! PY="$(colibri_python)"; then
    echo "FAIL: need Python ≥ 3.10 for Colibri"
    exit 1
  fi
  export COLI PY ROOT COLIBRI_HOME
}
