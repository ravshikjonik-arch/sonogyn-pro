#!/bin/bash
# Отправка последнего iOS production-билда в App Store Connect (TestFlight)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
EAS="$ROOT/../../node_modules/.bin/eas"
BUILD_ID="${1:-3b670cdb-1382-41c6-9a6d-6f8d9c1c2f89}"

echo ""
echo "📤 Submit iOS → App Store Connect (TestFlight)"
echo "   Build: $BUILD_ID"
echo "   Если спросят ascAppId — это НЕ email, а номер из Connect:"
echo "   SonoGyn Pro → App Information → Apple ID (только цифры)."
echo "   Подробно: docs/TESTFLIGHT-SUBMIT-RU.md"
echo ""

"$EAS" submit --platform ios --profile production --id "$BUILD_ID"

echo ""
echo "Готово. TestFlight: https://appstoreconnect.apple.com"
read -r -p "Enter…" _
