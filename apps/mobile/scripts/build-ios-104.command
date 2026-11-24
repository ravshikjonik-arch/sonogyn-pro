#!/bin/bash
# SonoGyn Pro · iOS 1.0.4 production → App Store Connect
# Двойной клик или: bash apps/mobile/scripts/build-ios-104.command
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
EAS="$ROOT/../../node_modules/.bin/eas"
export EAS_SKIP_AUTO_FINGERPRINT=1

echo ""
echo "🍎 SonoGyn Pro iOS 1.0.4 (guest, no IAP) → EAS production"
echo "   Нужен интернет до expo.dev (VPN, если api.expo.dev таймаут)"
echo ""

if ! "$EAS" whoami &>/dev/null; then
  echo "Сначала войдите: $EAS login"
  exit 1
fi
echo "Expo: $("$EAS" whoami 2>/dev/null | head -1)"
echo ""

"$EAS" build --platform ios --profile production --message "1.0.4 (31) privacy 5.1.1 + in-app account delete"

echo ""
read -r -p "Отправить последний билд в App Store Connect / TestFlight? [y/N] " SUB
SUB_LC="$(printf '%s' "$SUB" | tr '[:upper:]' '[:lower:]')"
if [[ "$SUB_LC" == "y" || "$SUB_LC" == "yes" || "$SUB_LC" == "д" || "$SUB_LC" == "да" ]]; then
  "$EAS" submit --platform ios --profile production --latest
  echo ""
  echo "Дальше в Connect:"
  echo "  1) App Privacy в Connect — см. docs/APP-STORE-5-1-1-PRIVACY-FIX-RU.md"
  echo "  2) Выбрать билд 1.0.4 (31+)"
  echo "  2) Sign-in required = No + Notes (guest)"
  echo "  3) Reply Resolution Center + Submit for Review"
  echo "  docs/APP-STORE-REVIEW-NOTES.md"
fi

echo ""
read -r -p "Enter…" _
