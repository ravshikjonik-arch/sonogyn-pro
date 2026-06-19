#!/bin/bash
# Вставьте Secret key из Supabase — скрипт сам запишет в .env.local
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env.local"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Нет файла: $ENV_FILE"
  exit 1
fi

echo ""
echo "=========================================="
echo "  Supabase Secret key → .env.local"
echo "=========================================="
echo ""
echo "1. Скопируйте Secret key в Supabase (Settings → API)"
echo "2. Вставьте сюда (Cmd+V) и нажмите Enter"
echo ""
read -r KEY

KEY="$(echo "$KEY" | tr -d '[:space:]')"
if [[ -z "$KEY" ]]; then
  echo "Пусто — отмена."
  exit 1
fi

if [[ "$KEY" == eyJ* ]]; then
  :
else
  echo "Похоже не на JWT-ключ. Всё равно записать? (y/n)"
  read -r yn
  [[ "$yn" == "y" || "$yn" == "Y" ]] || exit 1
fi

# Удалить старую строку и добавить новую
grep -v '^SUPABASE_SERVICE_ROLE_KEY=' "$ENV_FILE" | grep -v '^# SUPABASE_SERVICE_ROLE_KEY=' > "$ENV_FILE.tmp" || true
mv "$ENV_FILE.tmp" "$ENV_FILE"

# Вставить после блока DEV (после строки с DEV_LOGIN_INSTITUTION если есть)
if grep -q '^DEV_LOGIN_INSTITUTION=' "$ENV_FILE"; then
  awk -v key="$KEY" '
    { print }
    /^DEV_LOGIN_INSTITUTION=/ { print "SUPABASE_SERVICE_ROLE_KEY=" key; done=1 }
    END { if (!done) print "SUPABASE_SERVICE_ROLE_KEY=" key }
  ' "$ENV_FILE" > "$ENV_FILE.new" && mv "$ENV_FILE.new" "$ENV_FILE"
else
  echo "SUPABASE_SERVICE_ROLE_KEY=$KEY" >> "$ENV_FILE"
fi

echo ""
echo "✓ Записано в apps/web/.env.local"
echo ""
echo "Перезапустите сайт (из корня проекта):"
echo "  cd $ROOT/../.. && npm run dev:web"
echo ""
