# Connect за 3 минуты — build **1.0.4 (36)**

**Уже сделано за вас (EAS):** IPA загружен в App Store Connect · build **36** · submit `9440cf36-7426-47a9-b652-1f7341de5630`.

**Остаётся только UI Connect** (Apple ID + 2FA — агент войти не может).

## Ссылки

**Сначала только корень** (глубокие URL часто падают с `ERR_FAILED`, пока нет сессии или из‑за сети):

1. https://appstoreconnect.apple.com  
2. Вход Apple ID → **Apps** → **SonoGyn Pro** → дальше меню слева.

Если `ERR_FAILED` / таймаут в РФ — другой браузер (Safari), отключить блокировщики, **VPN** (ЕС/США), или приложение **App Store Connect** на iPhone.

После входа (внутри Connect, из меню):

- **TestFlight** → iOS → build **36**
- **App Store** → версия **1.0.4** → Build / Submit
- **App Privacy** (если нужно)
- **Resolution Center** (если открыт reject)

Альтернатива: статус билда на Expo (без Connect):  
https://expo.dev/accounts/yakrav7700/projects/us-risk-calc/builds/62f1045c-a9d1-4376-a227-39a28448756a

---

## Клик 1 · Build

**App Store** → версия **1.0.4** → **Build** → **+** → выбрать **36** (не 29–35) → **Save**.

---

## Клик 2 · App Review Information

| Поле | Значение |
|------|----------|
| Sign-in required | **No** |
| User name / Password | пусто |

**Notes** — скопируйте из `APP-STORE-RESUBMIT-CONNECT-RU.md`, раздел B (там уже build **36** и O-RADS фото).

---

## Клик 3 · Submit

**Add for Review** → **Submit to App Review**.

Если серая кнопка из‑за **подписок** — снимите IAP с этой версии, Submit только app (см. `APP-STORE-RESUBMIT-CONNECT-RU.md` §D).

**Export compliance:** encryption = **No** (`ITSAppUsesNonExemptEncryption = false`).

---

## Метаданные (если Connect просит заполнить)

Из `store-assets/app-store-copy-ru.json`:

- Privacy: `https://sonogyn-pro.ru/privacy`
- Support: `Sonogyn-pro@mail.ru`
- What's New: `1.0.4: O-RADS assist photo, privacy consent v2, guest pilot until 27.12.2026. Review as guest.`

---

## Проверка на телефоне (опционально)

TestFlight **36** → Consent (4 галочки) → O-RADS → «Описание / фото» → Галерея (обезличенный скрин).