#!/bin/bash
# Отправка iOS production-билда в App Store Connect (TestFlight)
# Использование:
#   ./scripts/submit-ios-testflight.command           → --latest
#   ./scripts/submit-ios-testflight.command <buildId> → конкретный EAS Build ID
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
EAS="$ROOT/../../node_modules/.bin/eas"
BUILD_ID="${1:-}"

echo ""
echo "📤 Submit iOS → App Store Connect (TestFlight)"
echo "   ASC App ID: 6825292354 (eas.json)"
echo "   Если спросят ascAppId — это НЕ email, а номер из Connect."
echo "   Подробно: docs/TESTFLIGHT-SUBMIT-RU.md"
echo ""

if [[ -n "$BUILD_ID" ]]; then
  echo "   Build ID: $BUILD_ID"
  "$EAS" submit --platform ios --profile production --id "$BUILD_ID"
else
  echo "   Режим: --latest (последний успешный production iOS build)"
  "$EAS" submit --platform ios --profile production --latest
fi

echo ""
echo "Готово. TestFlight: https://appstoreconnect.apple.com"
read -r -p "Enter…" _
