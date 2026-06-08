#!/usr/bin/env bash
# Быстрый статус dev — скопируйте ссылки в браузер / телефон

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "")"

port3000="$(lsof -nP -iTCP:3000 -sTCP:LISTEN 2>/dev/null | awk 'NR==2{print $1,$2}' || true)"
port3001="$(lsof -nP -iTCP:3001 -sTCP:LISTEN 2>/dev/null | awk 'NR==2{print $1,$2}' || true)"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  SonoGyn Pro — терминал ($(date '+%d.%m.%Y %H:%M'))"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  Проект:  $ROOT"
echo "  Фаундер: Якубов Равшан Вахобжонович → кабинет: Якубов Р.В."
echo ""
if [[ -n "$port3000" ]]; then
  echo "  Web:     ✓ порт 3000 ($port3000)"
else
  echo "  Web:     ✗ порт 3000 свободен — запустите: npm run dev:web:lan"
fi
if [[ -n "$port3001" ]]; then
  echo "  Другой:  ⚠ порт 3001 занят ($port3001) — не дублируйте next dev"
fi
echo ""
echo "── Mac (localhost) ─────────────────────────────────────────"
echo "  http://127.0.0.1:3000/app              — кабинет врача"
echo "  http://127.0.0.1:3000/register         — регистрация (ФИО → Якубов Р.В.)"
echo "  http://127.0.0.1:3000/profile          — профиль"
echo "  http://127.0.0.1:3000/calculators      — калькуляторы"
echo "  http://127.0.0.1:3000/calculators/o-rads"
echo "  http://127.0.0.1:3000/calculators/endometrium"
echo "  http://127.0.0.1:3000/calculators/cervical-length"
echo "  http://127.0.0.1:3000/mockups            — выбор макета (матка / МЖ)"
echo "  http://127.0.0.1:3000/uterus-3d          — макет матки · FIGO"
echo "  http://127.0.0.1:3000/breast-3d          — макет МЖ · BI-RADS"
echo "  http://127.0.0.1:3000/ovary-atlas       — макет яичника · O-RADS · ИИ"
echo ""
if [[ -n "$IP" ]]; then
  echo "── Телефон (Wi‑Fi, тот же IP Mac) ─────────────────────────"
  echo "  LAN IP:  $IP"
  echo "  http://$IP:3000/app"
  echo "  http://$IP:3000/calculators/o-rads"
  echo ""
else
  echo "── Телефон ────────────────────────────────────────────────"
  echo "  LAN IP не найден (en0/en1). Команда: ipconfig getifaddr en0"
  echo ""
fi
echo "── Запуск ─────────────────────────────────────────────────"
echo "  cd $ROOT"
echo "  npm run dev:web:lan    # Mac + телефон"
echo "  npm run terminal:info  # этот вывод снова"
echo ""
echo "── Dev без логина (только local) ───────────────────────────"
echo "  apps/web/.env.local → DEV_SKIP_AUTH=true"
echo "  DEV_LOGIN_FULL_NAME=Якубов Равшан Вахобжонович"
echo ""
echo "── Если «Another next dev» ────────────────────────────────"
echo "  lsof -ti:3000 -ti:3001 | xargs kill -9 2>/dev/null"
echo "  rm -f apps/web/.next/dev/lock"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
