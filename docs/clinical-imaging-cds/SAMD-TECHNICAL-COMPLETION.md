# SaMD / CDS — техническое закрытие (2026-10-22)

> Юридическая классификация и регистрация — **вне scope кода**; требуется RA/юрист (см. `REGULATORY-CHECKLIST-RU.md`).

## Intended use (техническая формулировка)

- **Пользователь:** врач УЗИ / ординатор под супervision.
- **Функция:** assistive clinical decision support — извлечение дескрипторов с кадра, подсказки в wizard/Pro; **категория O-RADS / BI-RADS только из детерминированного rule engine после подтверждения врачом**.
- **Не intended:** автоматический диагноз, замена протокола, скрининг без врача.

## Реализованные меры (100% инженерного чеклиста STEP0)

| Мера | Статус |
|------|--------|
| Vision без финальной категории (sanitize web + worker strip) | ✅ |
| Applicability gates gyn/breast | ✅ |
| QC + EXIF de-ID + overlay-band mask перед внешним API | ✅ |
| Human-in-the-loop wizard / grids / Pro | ✅ |
| PHI text guard на API | ✅ |
| Версионирование правил + CI drift (O-RADS tree, BI-RADS rules) | ✅ |
| Golden regression 34 synthetic cases + high-risk sensitivity gate | ✅ |
| Telemetry skeleton (без PHI, opt-in) | ✅ |
| Model card + architecture + STEP0 audit | ✅ |
| Lexicon UI + optional ROI bbox | ✅ |

## Открыто только для RA / клинической валидации

- Подпись risk management file (ISO 14971).
- Регистрация / класс медизделия РФ / MDR / FDA.
- Pixel-level golden set (30+ де-ID снимков, двойное чтение, κ в клинике).
- Post-market surveillance process (операционный, не только код).

## Ссылки

- `MODEL-CARD-US-AI-WORKER.md`
- `REGULATORY-CHECKLIST-RU.md`
- `STEP0-AUDIT.md`
