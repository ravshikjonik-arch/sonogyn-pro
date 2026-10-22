# Model card — US AI Worker (assistive)

## Назначение

Вспомогательное описание кадров УЗИ (гинекология, МЖ, акушерство…) для **черновика признаков**. Не ставит диагноз и **не должна** выдавать финальную категорию O-RADS/BI-RADS (CDS v2).

## Inputs

- JPEG/PNG/WebP (base64), опционально DICOM через worker.
- Клинический контекст (без PHI).

## Outputs

- `findings[]`, `lexiconFeatures[]`, `scanErrors[]`, narrative summary.
- Категорийные поля **удаляются** на web (`sanitizeVisionForRuleEngine`).

## Limitations

- Фото экрана, HEIC, низкое разрешение — QC warn/block.
- Burned-in PHI — не удаляется автоматически.
- Out-of-distribution — частично через scanErrors; полный OOD classifier — backlog.

## Versioning

`modelVersion` / `pipeline` в JSON ответа worker. Правила категорий — см. `RULES-VERSIONS.json`.

## Safety

Assistive disclaimer в worker + web. Решение — врач. High-risk asymmetry: при сомнении — scanErrors и низкая confidence, не «успокаивать».
