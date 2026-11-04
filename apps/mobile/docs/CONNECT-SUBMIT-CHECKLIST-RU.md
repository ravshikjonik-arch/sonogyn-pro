# App Store Connect — чеклист после TestFlight

## 1. Скриншоты (iPhone 6.7", 1290×2796)

На Mac:

1. Откройте Simulator → **iPhone 16 Pro Max** (или 15 Pro Max).
2. Запустите приложение (TestFlight или `npx expo run:ios`).
3. Consent → «Начать» → кадры без ПДн пациентов.
4. В терминале:

```bash
cd apps/mobile
bash scripts/capture-ios-screenshots.sh
```

5. Откройте `store-assets/generate-frames.html` → экспорт кадров.
6. Загрузите в Connect → версия → Screenshots (iPhone 6.7").

Тексты: `store-assets/app-store-copy-ru.json`.

## 2. Карточка версии

| Поле | Значение |
|------|----------|
| Описание / keywords / what’s new | из `app-store-copy-ru.json` |
| Privacy Policy | https://sonogyn-pro.ru/privacy |
| Terms / EULA | https://sonogyn-pro.ru/terms |
| Support | Sonogyn-pro@mail.ru |
| Age | 4+ / medical reference |
| Sign-in required | **No** |
| Notes | `docs/APP-STORE-REVIEW-NOTES.md` |

## 3. Export compliance

ITSAppUsesNonExemptEncryption = **false** → обычно «No» encryption.

## 4. Сборка

Выбрать IPA из TestFlight (build **19+** guest pilot). Не старые 1.0.1 login-only.
