#!/bin/bash
# Отправить последний iOS production-билд в App Store Connect (после «Build finished»)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
EAS="$ROOT/../../node_modules/.bin/eas"

echo ""
echo "📤 Submit последнего iOS билда → App Store Connect / TestFlight"
echo ""

"$EAS" submit --platform ios --profile production --latest

echo ""
echo "Дальше: TestFlight → дождаться Processing → Export Compliance → версия 1.0 → Сборка +"
echo "https://appstoreconnect.apple.com"
read -r -p "Enter…" _
