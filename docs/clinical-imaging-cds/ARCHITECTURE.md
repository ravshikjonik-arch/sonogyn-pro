# Clinical Imaging CDS — целевая архитектура

```
Upload (camera/gallery/DICOM→PNG)
  → prepareImagingFramesForAnalysis  [EXIF strip, QC]
  → US AI Worker / future on-device CV
  → sanitizeVisionForRuleEngine      [no category fields]
  → NLP / mapExtractedToHints        [structured hints + confidence]
  → Physician UI confirm             [wizard, grids, Pro]
  → Rule engines (@repo/*)           [O-RADS, BI-RADS, IOTA, FIGO…]
  → Report (@repo/report-generator)  [disclaimer, trace, recommendations]
```

**Инвариант:** итоговая категория риска только из **подтверждённых** признаков и **версионированных** правил.

## Модули

- `apps/web/lib/ai/imaging-cds/` — QC, de-ID orchestration, sanitize, flags.
- `apps/web/lib/ai/*-ultrasound-assist.ts` — domain orchestration.
- `packages/orads-us`, `packages/birads-us` — источник истины для категорий.
- `services/us-ai-worker` — assistive vision (lexicon-only prompts in v2).

## Сосуществование со старым pipeline

Старый worker остаётся; CDS v2 включается по env. Переключение production — после golden-set регрессии (этап 9 STEP0).
