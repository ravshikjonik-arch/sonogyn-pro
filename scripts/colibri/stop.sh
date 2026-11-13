#!/usr/bin/env bash
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/lib.sh"
require_colibri
cd "$COLIBRI_HOME"
exec "$PY" "$COLI" stop "$@"
