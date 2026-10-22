#!/usr/bin/env bash
# One-shot Fly deploy for SonoGyn US AI Worker (after: fly auth login)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export PATH="${HOME}/.fly/bin:${PATH}"
command -v fly >/dev/null || { echo "Install: curl -L https://fly.io/install.sh | sh"; exit 1; }

fly auth whoami

APP="${FLY_APP_NAME:-sonogyn-us-ai}"
SECRET_FILE="${US_AI_SECRET_FILE:-$ROOT/../../.tmp/railway-rotation-2026-10-22.txt}"
OR_KEY="${OPENROUTER_API_KEY:-}"

if [[ -z "$OR_KEY" && -f "$ROOT/../../.tmp/openrouter-local.txt" ]]; then
  OR_KEY="$(grep -E '^OPENROUTER_API_KEY=' "$ROOT/../../.tmp/openrouter-local.txt" | cut -d= -f2- | tr -d ' \r')"
fi

WORKER_SECRET="$(grep -E '^US_AI_WORKER_SECRET=' "$SECRET_FILE" | cut -d= -f2- | tr -d ' \r')"
if [[ -z "$WORKER_SECRET" ]]; then
  echo "Missing US_AI_WORKER_SECRET in $SECRET_FILE"
  exit 1
fi
if [[ -z "$OR_KEY" ]]; then
  echo "Set OPENROUTER_API_KEY env or create .tmp/openrouter-local.txt with OPENROUTER_API_KEY=sk-or-..."
  exit 1
fi

if ! fly apps list 2>/dev/null | grep -q "$APP"; then
  fly launch --no-deploy --copy-config --name "$APP" --region fra --yes
fi

fly secrets set \
  US_AI_WORKER_SECRET="$WORKER_SECRET" \
  OPENROUTER_API_KEY="$OR_KEY" \
  US_VISION_MODEL="${US_VISION_MODEL:-openai/gpt-4o-mini}" \
  US_VISION_BACKEND="${US_VISION_BACKEND:-openrouter}" \
  US_AI_WORKER_REFERER="${US_AI_WORKER_REFERER:-https://sonogyn-pro.ru}"

echo "Building and deploying (10–20 min first time)..."
fly deploy --app "$APP" --remote-only --buildkit --ha=false

URL="https://$(fly status --app "$APP" 2>/dev/null | awk '/Hostname/ {print $2}')"
echo ""
echo "Worker URL: $URL"
echo "Smoke: curl -sS ${URL}/health | python3 -m json.tool"
echo "Vercel: US_AI_WORKER_URL=$URL (production + preview) → Redeploy"
