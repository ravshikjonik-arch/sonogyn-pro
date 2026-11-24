# iOS App Store — финальный запуск (build **31**, 5.1.1)

Версия **1.0.4 (31)**. Пилот: гость без обязательного входа. Privacy manifest заполнен.

---

## Шаг 1 · App Store Connect → App Privacy (сначала!)

1. Откройте приложение → **App Privacy** → **Edit**.
2. **Data Used to Track You:** **No**.
3. **Data Collected** — не «Data Not Collected». Типы (все **Linked to User = Yes**, **Used for Tracking = No**, purpose **App Functionality**):

   - Contact Info → Email Address  
   - Identifiers → User ID  
   - Identifiers → Device ID  
   - User Content → Photos or Videos  
   - User Content → Audio Data  
   - User Content → Other User Content  
   - Purchases → Purchase History *(SDK RevenueCat в бинарнике; пилот без IAP, но SDK есть)*  

4. **Privacy Policy URL:** `https://sonogyn-pro.ru/privacy`  
5. Сохранить.

Подробности: `docs/APP-STORE-5-1-1-PRIVACY-FIX-RU.md`.

---

## Шаг 2 · Сборка и загрузка

На Mac (интернет до expo.dev):

```bash
cd /Users/yakrav7700/Desktop/05-04-2026_11-45-39/apps/mobile
bash scripts/build-ios-104.command
```

Или:

```bash
../../node_modules/.bin/eas build --platform ios --profile production \
  --message "1.0.4 (31) privacy manifest + account deletion"
```

После **Build finished:**

```bash
bash scripts/submit-latest-ios.command
```

В Connect дождитесь **Processing** (10–40 мин).

---

## Шаг 3 · Версия 1.0.4 в Connect

| Поле | Значение |
|------|----------|
| Build | **1.0.4 (31)** |
| Privacy Policy | https://sonogyn-pro.ru/privacy |
| Sign-in required | **No** |
| Export encryption | **No** (ITSAppUsesNonExemptEncryption = false) |
| Notes | `docs/APP-STORE-REVIEW-NOTES.md` |
| Support | Sonogyn-pro@mail.ru |

Чеклист скриншотов: `docs/CONNECT-SUBMIT-CHECKLIST-RU.md`.

---

## Шаг 4 · Resolution Center (5.1.1)

Вставьте (англ.) из `APP-STORE-5-1-1-PRIVACY-FIX-RU.md`, раздел C. Укажите **build 31**.

Дополнительно для ревьюера:

```
Account deletion: Profile tab → sign in (optional) → «Удалить аккаунт и данные»
(initiates server-side delete via https://sonogyn-pro.ru/api/profile/account).
Guest users are not required to create an account.
```

---

## Шаг 5 · Submit for Review

Проверьте в TestFlight на телефоне:

- Consent → Политика / Условия открываются по HTTPS  
- Калькуляторы без логина  
- Профиль → (после входа) кнопка удаления аккаунта видна  

**Submit for Review**.

---

## Откат

- Privacy в Connect — вернуть предыдущие ответы (не рекомендуется).  
- Бинарник — предыдущий build 30 в Connect, если 31 не прошёл processing.  
- Код — `git checkout` на файлы `PrivacyInfo.xcprivacy`, `ProfileScreen.tsx`, `app.json` buildNumber.