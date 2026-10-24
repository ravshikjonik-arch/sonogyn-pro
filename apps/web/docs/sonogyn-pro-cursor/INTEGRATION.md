# Интеграция Kimi → SonoGyn Pro

## Маршрут

https://sonogyn-pro.ru/tools/calc/gyn/ultrasound-10-steps

## Архитектура

- **Контент (SSOT):** `packages/gynecology-ultrasound-10-steps/src/protocol-content.json` — копия `02_PROTOCOL_CONTENT.json`.
- **Рендер текста:** детерминированные шаблоны в `@repo/gynecology-ultrasound-10-steps` (`renderProtocolText`).
- **Черновик:** `localStorage` (`sonogyn:gynecology-ultrasound-10-steps:v1`); привязка к patient/study — следующий инкремент (structured draft API).
- **O-RADS / IOTA:** только ссылки на `/tools/calc/rads/o-rads` и `/tools/calc/rads/iota`; правил из PDF нет.

## Дальше (из master prompt)

- Supabase draft + lifecycle (`protocol_structured_drafts`)
- Spatial swipe UI parity
- Единицы матки — клиническое подтверждение (`sourceClinicalValidationRequired`)
