# После Submit — build **1.0.4 (36)**

**Отправлено на проверку:** 24.11.2026 (EAS build `62f1045c`, ASC **36**).

## Статусы в Connect

| Статус | Что делать |
|--------|------------|
| **Waiting for Review** | Ждать 24–72 ч (часто 1–2 дня) |
| **In Review** | Не менять бинарник; ответить в Resolution Center в течение 24 ч |
| **Rejected** | Текст отказа → чат с Cursor → ответ EN + при необходимости build 37 |
| **Approved** | Release → **вручную** или автоматически по настройке версии |

## Если придёт отказ (шпаргалка)

| Guideline | Действие |
|-----------|----------|
| **2.1** Demo | Notes: guest, без логина; путь consent → «Продолжить» |
| **5.1.1(i)/(ii)** ИИ | Privacy §8, 4 чекбокса, O-RADS фото в Notes (`APP-STORE-RESUBMIT-CONNECT-RU.md` B) |
| **5.1.1(ix)** Organization | Параллельно ИП + D-U-N-S: `docs/operations/apple-organization-duns-ru.md` |
| **IAP** | Пилот без покупок до 27.12.2026; снять IAP с версии при блоке submit |
| **Privacy questionnaire** | App Privacy ≠ «Data Not Collected» — `APP-STORE-5-1-1-PRIVACY-FIX-RU.md` |

## Ответ в Resolution Center (шаблон)

```
Hello App Review,

We submitted build 1.0.4 (36) addressing prior feedback on privacy, third-party AI consent, guest access, and account deletion.

Review as guest: launch → consent (including third-party AI checkbox) → «Продолжить» → calculators.
Privacy: https://sonogyn-pro.ru/privacy (section 8 — third-party AI).
Account deletion: Profile → sign in → «Удалить аккаунт и данные».

[Вставьте 2–3 предложения, что именно исправили под их пункт отказа.]

Thank you,
SonoGyn Pro
```

## После **Approved**

1. **App Store** → **Release This Version** (или запланировать дату).
2. TestFlight → smoke на проде из Store (не только TF).
3. Приложение **App Store Connect** на iPhone — push/метрики.

## Не трогаем во время In Review

- Не удалять build 36 из версии без причины.
- Не менять bundle id / capabilities.
- Критический hotfix — только новый build **37** + новый Submit (чеклист: `EAS-BUILD-37-CHECKLIST-RU.md`).