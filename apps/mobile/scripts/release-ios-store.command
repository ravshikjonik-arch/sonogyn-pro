#!/bin/bash
# SonoGyn Pro · iOS App Store / TestFlight (интерактивный Apple login)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
EAS="$ROOT/../../node_modules/.bin/eas"

export EAS_SKIP_AUTO_FINGERPRINT=1

echo ""
echo "🍎 SonoGyn Pro · iOS production (App Store / TestFlight)"
echo "   Проект: com.yakrav7700.usriskcalc · версия из app.json"
echo ""

if ! "$EAS" whoami &>/dev/null; then
  echo "Сначала: npx eas-cli login"
  exit 1
fi
echo "Expo: $("$EAS" whoami 2>/dev/null | head -1)"
echo ""
echo "Сейчас EAS спросит Apple ID / сертификаты (нужна подписка Developer)."
echo ""

"$EAS" build --platform ios --profile production --message "Pilot 1.0.1 iOS store"

echo ""
read -r -p "Отправить последний билд в App Store Connect? [y/N] " SUB
SUB_LC="$(printf '%s' "$SUB" | tr '[:upper:]' '[:lower:]')"
if [[ "$SUB_LC" == "y" || "$SUB_LC" == "yes" || "$SUB_LC" == "д" || "$SUB_LC" == "да" ]]; then
  "$EAS" submit --platform ios --profile production --latest
  echo "Проверьте TestFlight: https://appstoreconnect.apple.com"
fi

echo ""
read -r -p "Нажмите Enter, чтобы закрыть окно…" _
