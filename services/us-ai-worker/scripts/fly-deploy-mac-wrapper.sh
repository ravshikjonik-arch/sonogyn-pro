#!/usr/bin/env bash
# Local Fly deploy after: fly auth login + .tmp/openrouter-local.txt (gitignored).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OR_FILE="${OPENROUTER_LOCAL_FILE:-$ROOT/../../.tmp/openrouter-local.txt}"
export PATH="${HOME}/.fly/bin:${PATH}"
if ! grep -qE '^OPENROUTER_API_KEY=sk-or-' "$OR_FILE" 2>/dev/null; then
  echo "Add OPENROUTER_API_KEY=sk-or-... to $OR_FILE (see docs/FLY-DEPLOY-RU.md)"
  exit 1
fi
exec "$ROOT/scripts/fly-deploy-production.sh"
