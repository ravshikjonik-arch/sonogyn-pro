# Apple Organization + D-U-N-S (5.1.1(ix))

Apple для части **health / patient-related** приложений требует аккаунт **Organization**, не **Individual**.

SonoGyn Pro позиционируется как **CDS для врачей** (не пациентское приложение), но ревью уже поднимало **5.1.1(ix)**.

## Параллельный трек (пока идёт ревью build 36)

| Шаг | Действие |
|-----|----------|
| 1 | Оформить **ИП** (или ООО) — юрист/налоговая, ИНН уже есть (самозанятый → ИП при необходимости) |
| 2 | Получить **D-U-N-S** на юрлицо: [D&B / Apple flow](https://developer.apple.com/enroll/duns-lookup/) |
| 3 | **developer.apple.com/contact** — запросить перенос Individual → Organization (или новый Org аккаунт) |
| 4 | После Org: перевыпустить сертификаты, EAS credentials, team id в `eas.json` |

## Сроки (ориентир)

- D-U-N-S: **2–14 рабочих дней** (иногда дольше).
- Перенос / новый Org в Apple: **1–4 недели**.

## Что писать Apple (кратко)

```
We are a physician-founded CDS platform for licensed clinicians only (not patients).
We are completing business enrollment (sole proprietor / LLC) and D-U-N-S to migrate to Organization.
We request guidance whether our CDS + educational scope may proceed on Individual during enrollment.
```

## В продукте не менять до решения

- Bundle id `com.yakrav7700.usriskcalc` можно оставить при миграции team, но согласовать с Apple/EAS.
- Публичные тексты: «для врачей», «не диагноз», без patient-facing care.

## Связанные файлы

- `apps/mobile/docs/APP-STORE-RESUBMIT-CONNECT-RU.md` — абзац Organization в Notes
- `apps/mobile/eas.json` — `appleTeamId`, `ascAppId`