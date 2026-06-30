#!/usr/bin/env bash
# Пилот · EAS Android preview — облако или локально на устройстве.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo ""
echo "📱 SonoGyn Pro · Android preview build"
echo ""

if ! npx eas-cli whoami &>/dev/null; then
  echo "❌ Нет входа в Expo. Выполните: npm run eas:login"
  exit 1
fi

echo "✓ Expo: $(npx eas-cli whoami 2>/dev/null | head -1)"
echo ""

# Последний Android build
echo "Последние Android builds:"
npx eas-cli build:list --platform android --limit 3 --non-interactive 2>/dev/null || true
echo ""

if [[ "${1:-}" == "--local" ]]; then
  if ! command -v adb &>/dev/null; then
    echo "❌ adb не найден. Установите Android Studio → SDK Platform Tools"
    echo "   https://developer.android.com/studio"
    echo "   Затем: export ANDROID_HOME=\$HOME/Library/Android/sdk"
    echo "           export PATH=\$PATH:\$ANDROID_HOME/platform-tools"
    exit 1
  fi
  echo "Локальная dev-сборка на подключённое устройство…"
  npx expo run:android --device
  exit 0
fi

echo "Запуск облачной сборки (profile: preview, APK)…"
echo "Если лимит credits — откройте: https://expo.dev/accounts/yakrav7700/settings/billing"
echo ""

set +e
OUT=$(CI=1 npx eas-cli build --platform android --profile preview --non-interactive 2>&1)
CODE=$?
set -e
echo "$OUT"

if echo "$OUT" | grep -qi "build credits"; then
  echo ""
  echo "⚠️  Лимит EAS credits. Варианты:"
  echo "  1. Upgrade: https://expo.dev/accounts/yakrav7700/settings/billing"
  echo "  2. Локально (USB + Android Studio): npm run eas:android:local"
  echo "  3. Дождаться сброса billing period"
  exit 1
fi

exit "$CODE"
