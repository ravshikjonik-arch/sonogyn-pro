# TestFlight — загрузка IPA (один раз настроить)

## Что такое «Apple ID приложения» (ascAppId)

Это **не** ваш email и **не** пароль iCloud.

Это **номер карточки приложения** в App Store Connect (9–10 цифр), например `6751234567`.

### Где взять

1. Откройте https://appstoreconnect.apple.com  
2. **Мои приложения** → **SonoGyn Pro**  
3. Слева **Информация о приложении** / **App Information**  
4. Поле **Apple ID** — скопируйте **только цифры**.

Сохраните в заметках — EAS спросит один раз, потом запомнит в `eas.json` (можно добавить `"ascAppId": "ВАШ_НОМЕР"` в `submit.production.ios`).

## Способ A — EAS Submit (рекомендуется)

```bash
cd apps/mobile
../../node_modules/.bin/eas submit --platform ios --profile production --id 5ff9ecd4-a1c1-45fa-851e-0a1e91696df2
```

Или двойной клик: `scripts/submit-ios-testflight.command`

При запросе **ascAppId** — вставьте цифры из шага выше.

## Способ B — Transporter (без ascAppId в терминале)

1. Установите **Transporter** из Mac App Store.  
2. Скачайте IPA: https://expo.dev/artifacts/eas/EHyw9iyvxMMuSjV63F6kKVhKxuG-yHeRg1NQmPvsSTM.ipa  
3. Перетащите файл в Transporter → **Deliver**.

## После загрузки

1. **TestFlight** → сборка **Processing** (10–60 мин).  
2. **Export Compliance** — обычно «No» (шифрование только стандартное).  
3. Версия приложения → **Сборка** → выбрать билд → сохранить.

## Текущий production-билд (auth + только вход)

| Поле | Значение |
|------|----------|
| ASC App ID | `6825292354` (в `eas.json` submit.production.ios) |
| Build ID | `3b670cdb-1382-41c6-9a6d-6f8d9c1c2f89` (1.0.1 / 11, login-only) |
| Версия в IPA | **1.0.1 (10)** — build 5 для 1.0.0 Apple уже занял, не переиспользуйте |
| autoIncrement | `true` в `eas.json` production |
