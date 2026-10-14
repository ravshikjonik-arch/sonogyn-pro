#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export DEVELOPER_DIR="${DEVELOPER_DIR:-/Applications/Xcode.app/Contents/Developer}"
export PATH="/opt/homebrew/bin:${PATH}"

if [[ ! -d "$ROOT/ios/SonoGynPro.xcworkspace" ]]; then
  echo "Нет ios/SonoGynPro.xcworkspace — сначала: npx expo prebuild --platform ios"
  exit 1
fi

(cd "$ROOT/ios" && pod install)
open "$ROOT/ios/SonoGynPro.xcworkspace"
echo "Xcode: scheme SonoGynPro → iPhone 17 (Simulator) → Run. Metro: npm start"
