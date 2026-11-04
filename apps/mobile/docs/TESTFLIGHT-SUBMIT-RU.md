# TestFlight — загрузка IPA

## ASC App ID

Это **не** email. В App Store Connect → SonoGyn Pro → App Information → **Apple ID** (цифры).

Сейчас в `eas.json`: `6825292354`.

## EAS Submit

```bash
cd apps/mobile
# последний production iOS build
../../node_modules/.bin/eas submit --platform ios --profile production --latest

# или явный Build ID
../../node_modules/.bin/eas submit --platform ios --profile production --id <EAS_BUILD_ID>
```

Двойной клик: `scripts/submit-ios-testflight.command` (по умолчанию `--latest`).

## После загрузки

1. TestFlight → Processing (10–60 мин).
2. Export Compliance — **No** (`ITSAppUsesNonExemptEncryption: false`).
3. Версия → выбрать сборку → сохранить.
4. Перед Submit for Review: Privacy `https://sonogyn-pro.ru/privacy`, Terms `https://sonogyn-pro.ru/terms`, Notes из `APP-STORE-REVIEW-NOTES.md`.

## Текущий ориентир

| Поле | Значение |
|------|----------|
| ASC App ID | `6825292354` |
| Version | **1.0.3 (19)** |
| EAS Build ID | `8ccc728f-ae6a-4c37-bdb7-080141700a89` |
| Submission | `27911363-9294-4735-a752-d6a43b787aa9` (загружен в ASC) |
| Режим | guest / open access, **без IAP** |
| TestFlight | https://appstoreconnect.apple.com/apps/6825292354/testflight/ios |
