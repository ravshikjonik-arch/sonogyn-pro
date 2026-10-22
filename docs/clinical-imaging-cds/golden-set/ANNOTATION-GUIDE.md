# Golden set — разметка (шаблон)

1. **Де-ID:** без ФИО/ID на кадре; EXIF удалён.
2. **На кейс:** modality, domain (gyn/breast), device optional.
3. **Признаки:** JSON по `apps/web/lib/ai/imaging-cds/lexicon-schemas.ts`.
4. **Категория:** только после expert consensus (два читателя при споре).
5. **Manifest:** `manifest.json` со списком `{ id, imagePath, confirmedFeatures, category, systemVersion }`.

Метрики: feature F1, weighted κ category, sensitivity high-risk (O-RADS 4–5, BI-RADS ≥4).

Запуск: `node scripts/imaging-cds-eval.mjs --manifest path/to/manifest.json`
