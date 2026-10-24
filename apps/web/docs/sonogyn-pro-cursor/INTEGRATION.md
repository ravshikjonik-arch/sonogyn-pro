# Интеграция Kimi → SonoGyn Pro

## Маршрут

https://sonogyn-pro.ru/tools/calc/gyn/ultrasound-10-steps

## Архитектура

- **Контент (SSOT):** `packages/gynecology-ultrasound-10-steps/src/protocol-content.json` — копия `02_PROTOCOL_CONTENT.json`.
- **Рендер текста:** детерминированные шаблоны в `@repo/gynecology-ultrasound-10-steps` (`renderProtocolText`).
- **Черновик:** аккаунт **врача** (`doctor_tool_drafts`, `tool_id=gynecology_ultrasound_10_steps`) + кэш `localStorage`. **Без patient / study.**
- **API:** `GET/PUT /api/tools/gynecology-ultrasound-10-steps/draft` (только `auth.uid()`).
- **O-RADS / IOTA:** только ссылки на `/tools/calc/rads/o-rads` и `/tools/calc/rads/iota`; правил из PDF нет.

## Дальше (из master prompt)

- Миграция `20261024130000_doctor_tool_drafts.sql` на Supabase prod
- PDF / lifecycle versioning (amend), при необходимости
- Spatial swipe UI parity
- Единицы матки — клиническое подтверждение (`sourceClinicalValidationRequired`)
