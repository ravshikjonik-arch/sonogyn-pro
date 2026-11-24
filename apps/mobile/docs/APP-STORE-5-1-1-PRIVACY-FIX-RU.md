# App Store 5.1.1 — Privacy: Data Collection and Storage

**Симптом:** отклонение **5.1.1 Legal: Privacy - Data Collection and Storage**.

**Частая причина:** в **App Privacy** (Connect) указано «данные не собираются», а в приложении есть Supabase, микрофон → сервер, фото, push, RevenueCat SDK.

---

## A. App Store Connect (обязательно, без нового билда иногда не хватит)

1. **App Store Connect** → приложение → **App Privacy** → **Edit**.
2. **Tracking:** **No** (мы не используем IDFA / cross-app tracking).
3. **Data types — собираем** (пример для SonoGyn Pro):

| Тип | Linked to user | Purpose |
|-----|----------------|---------|
| Email Address | Yes | App Functionality (опциональный вход) |
| User ID | Yes | App Functionality (Supabase / Firebase / push) |
| Photos or Videos | Yes | App Functionality (учебные/обезличенные снимки) |
| Audio Data | Yes | App Functionality (диктовка → сервер Whisper) |
| Other User Content | Yes | App Functionality (кейсы, чат, тексты) |
| Device ID | Yes | App Functionality (push token) |
| Purchases | Yes | App Functionality (подписка PRO / StoreKit) |

4. **Privacy Policy URL:** `https://sonogyn-pro.ru/privacy` (проверить 200 в браузере).
5. **User Privacy Choices URL** — если нет отдельной страницы, можно тот же privacy или support email в Notes.
6. Версия приложения → **Privacy Policy** в метаданных — тот же URL.

---

## B. Бинарник (сделано в репо)

`ios/SonoGynPro/PrivacyInfo.xcprivacy` — заполнен `NSPrivacyCollectedDataTypes` (раньше был **пустой**).

После правки: **новый build** (buildNumber+1) → TestFlight → Submit for Review.

```bash
# пример: EAS или Xcode archive
cd apps/mobile
# bump buildNumber в app.json + Info.plist CFBundleVersion
```

---

## C. Текст для Resolution Center (англ.)

```
Hello App Review,

Thank you for the feedback regarding Guideline 5.1.1.

We updated our App Privacy questionnaire in App Store Connect to accurately
disclose data collection (optional email sign-in, user identifiers, photos,
audio for speech-to-text sent to our server, user-generated educational content,
device ID for push notifications, and purchase history for PRO subscription).

We updated the app Privacy Manifest (PrivacyInfo.xcprivacy) to match.

Privacy Policy: https://sonogyn-pro.ru/privacy
Terms: https://sonogyn-pro.ru/terms

The app can be used without registration (guest pilot). Consent screen requires
acceptance of Terms and Privacy Policy before use.

Please review build [NEW BUILD NUMBER].

Thank you.
```

---

## D. Проверка перед отправкой

- [ ] App Privacy **не** «Data Not Collected»
- [ ] Privacy URL открывается на устройстве (Safari)
- [ ] Consent → «Политика конфиденциальности» открывает HTTPS
- [ ] Microphone / Camera usage strings в Info.plist есть (уже есть)
- [ ] App Review Notes: guest access, без обязательного логина (`docs/APP-STORE-REVIEW-NOTES.md`)

---

## E. Если снова 5.1.1

Открой **View Submission** → **скопируй полный текст** rejection (иногда Apple просит конкретное: удаление данных, account deletion, шифрование backups). Пришли текст в чат — доработаем точечно (Account Deletion API, in-app link и т.д.).