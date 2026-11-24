# Повторная отправка iOS — что сделать в Connect (вы сами, 10–15 мин)

Автоматизация **не может** войти в Apple ID за вас. Бинарник **(36)** после EAS — attach + Submit вручную (в нём O-RADS «Описание / фото» + gyn-assist).

---

## A. Перед Submit (обязательно)

1. **Деплой веба** — чтобы на `https://sonogyn-pro.ru/privacy` был раздел **«8. Сторонние сервисы ИИ»** (после merge/deploy).
2. **Версия 1.0.4** → сборка **(36)** — **не (29–35)**.
3. **App Privacy** — данные собираются (см. `APP-STORE-5-1-1-PRIVACY-FIX-RU.md`).

---

## B. App Review Information → Notes (вставить целиком)

```
SonoGyn Pro — professional CDS/learning tools for licensed clinicians (not for patients as end users).

Sign-in: NOT required for review. Launch → consent (4 checkboxes including explicit third-party AI) → «Продолжить» → calculators.

Third-party AI (Guideline 5.1.1(i)/(ii)):
- Before any cloud AI, user must accept a dedicated checkbox naming SonoGyn API (sonogyn-pro.ru), OpenRouter, and Perplexity, and what text is sent. Privacy: https://sonogyn-pro.ru/privacy section 8.
- Optional vision assist: Calculators → O-RADS → «Описание / фото» → Галерея/Камера (de-identified US image only) → our API analyzes on sonogyn-pro.ru; covered by the same AI consent. Local O-RADS category still requires clinician confirmation in the stepper.
- Speech-to-text: separate in-screen checkbox before audio is uploaded to our server.
- Guest users can use calculators without AI chat if they only use non-AI screens.

Guideline 5.1.1(ix) Organization:
Developer is currently enrolled as an Individual (physician founder). We request review guidance whether sole proprietor / ИП conversion satisfies Organization, or whether our CDS positioning (no diagnosis, no patient-facing care) may proceed on Individual while we complete business enrollment.

IAP: PRO subscription metadata is attached for future; in-app purchases are disabled until 27.12.2026 pilot end (open access).

Account deletion: Profile → sign in → «Удалить аккаунт и данные».

Please review build 1.0.4 (36).
```

---

## C. Resolution Center → Reply (англ.)

Same content as Notes + reference Submission ID `28caea6b-5bb7-4a8e-9cf3-db3e227043a5`.

---

## D. Подписки в отправке

Если снова «всё заблокировано»: временно **снимите подписки с этой отправки** (оставьте только приложение), Submit, подписки — следующей волной.

---

## E. Individual vs Organization

Без **ИП/ООО + D-U-N-S** Apple **может снова** отклонить по **5.1.1(ix)**. Параллельно: [developer.apple.com/contact](https://developer.apple.com/contact) → Organization / sole proprietor.