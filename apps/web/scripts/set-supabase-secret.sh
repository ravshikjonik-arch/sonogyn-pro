#!/bin/bash
# Вставьте Secret key из Supabase — скрипт сам запишет в .env.local
set -euo pipefail
cd "$(dirname "$0")/.."
ENV_FILE=".env.local"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ Нет файла .env.local"
  exit 1
fi

echo ""
echo "=============================================="
echo "  SUPABASE Secret key → .env.local"
echo "=============================================="
echo ""
echo "1) Supabase → Settings → API → Secret key → Copy"
echo "2) Кликните ЭТОТ терминал"
echo "3) Вставьте ключ (Cmd+V) и нажмите Enter"
echo ""
printf "Вставьте ключ: "
read -r KEY

KEY="${KEY// /}"
if [[ -z "$KEY" ]]; then
  echo "❌ Пусто. Попробуйте снова: bash scripts/set-supabase-secret.sh"
  exit 1
fi
if [[ ! "$KEY" =~ ^eyJ ]]; then
  echo "⚠️  Ключ обычно начинается с eyJ... Вы уверены? Enter — да, Ctrl+C — отмена"
  read -r _
fi

cp "$ENV_FILE" "${ENV_FILE}.bak"
if grep -q '^SUPABASE_SERVICE_ROLE_KEY=' "$ENV_FILE"; then
  sed -i '' "s|^SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=${KEY}|" "$ENV_FILE"
elif grep -q '^# SUPABASE_SERVICE_ROLE_KEY=' "$ENV_FILE"; then
  sed -i '' "s|^# SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=${KEY}|" "$ENV_FILE"
else
  echo "SUPABASE_SERVICE_ROLE_KEY=${KEY}" >> "$ENV_FILE"
fi

echo ""
echo "✅ Готово! Ключ записан в apps/web/.env.local"
echo "   Резервная копия: .env.local.bak"
echo ""
echo "Дальше перезапустите сайт:"
echo "   cd ../.. && npm run dev:web"
echo ""
