# Structured Reporting Engine — Architecture

> **Фаза 1 · Приоритет #1** · STEP 4 ✅ **одобрено** · T1.1 ✅ schemas

---

## 1. Analysis — что уже есть

| Компонент | Путь | Зрелость |
|-----------|------|----------|
| Контракт отчёта v2026.1 | `apps/web/lib/ai/structured-report.ts` | Demo only |
| API stub | `apps/web/app/api/ai/structured-report/route.ts` | Demo JSON |
| IDEA report engine | `apps/web/features/idea-deep-endometriosis/lib/report-engine.ts` | Domain-specific |
| O-RADS protocol snippet | `packages/adnex-education/adnex-consensus.ts` | Adnex only |
| FMF protocols | `apps/web/lib/clinical-assistant/fmf-protocol.ts` | Obstetric |
| PDF spec builder | `apps/web/lib/reporting/document-spec-builders.ts` | Study protocol |
| Mobile generateReport | `apps/mobile/src/reporting/generateReport.ts` | Ovary only |
| US-AI worker schema | `services/us-ai-worker/sonogyn_agents/schema.py` | Parallel stack |

**Gap:** нет единого **Structured Reporting Engine (SRE)** с шаблонами, i18n, evidence, editable output для всех доменов.

---

## 2. PRD

### 2.1 Цель

Врач вводит структурированные данные (findings, measurements, morphology, O-RADS, IOTA) → система генерирует:

1. **Description** (описание)
2. **Impression** (заключение)
3. **Recommendations** (рекомендации)

С возможностью **редактирования** каждого блока перед сохранением/PDF.

### 2.2 Пользователь

👨‍⚕️ Врач-практик (primary). Ординатор — read-only шаблоны обучения.

### 2.3 User stories

| ID | Как врач… | Чтобы… |
|----|-----------|--------|
| SRE-01 | …выбрал шаблон «Придатки O-RADS» | …заполнить поля за 2–3 мин |
| SRE-02 | …видел live preview описания | …корректировать формулировки до финала |
| SRE-03 | …получил ссылку на ACR O-RADS / IOTA | …обосновать тактику |
| SRE-04 | …экспортировал PDF/DICOM SR (future) | …положить в МИС |
| SRE-05 | …переключил RU/EN | …отчёт для публикации/конференции |

### 2.4 Non-goals (v1)

- Автоматическая сегментация снимков
- Подпись КЭП / интеграция ЕГИСЗ
- Замена заключения врача (always assistive)

### 2.5 Acceptance criteria

- [ ] Один JSON-контракт `StructuredReportDocument` (Zod) web + mobile
- [ ] Минимум 3 шаблона: adnex O-RADS, thyroid TI-RADS, obstetric biometry
- [ ] RU + EN для всех generated strings
- [ ] Citations из `@repo/evidence-corpus` / guidelines
- [ ] Draft → edited → finalized lifecycle
- [ ] RLS: только owner + study team

---

## 3. Database design (Supabase)

### 3.1 Новые таблицы

```sql
-- report_templates (read-mostly, admin/author writes)
report_templates (
  id uuid PK,
  slug text UNIQUE,           -- 'adnex-orads-v1'
  domain text,                -- 'adnex' | 'thyroid' | 'obstetric' | ...
  version text,               -- semver
  locale text[],              -- ['ru','en']
  schema_json jsonb,          -- Zod-compatible field defs
  engine_id text,             -- 'sre-adnex-v1'
  is_active boolean,
  created_at, updated_at
)

-- structured_reports (user drafts)
structured_reports (
  id uuid PK,
  user_id uuid FK auth.users,
  patient_id uuid FK patients NULL,
  study_id uuid FK studies NULL,
  template_id uuid FK report_templates,
  status text CHECK (draft|edited|finalized|archived),
  input_json jsonb,           -- normalized findings input
  output_json jsonb,          -- { description, impression, recommendations, citations[] }
  edited_blocks jsonb,        -- user overrides per block
  locale text DEFAULT 'ru',
  finalized_at timestamptz,
  created_at, updated_at
)

-- report_citations (denormalized for search)
report_citation_links (
  report_id uuid FK,
  corpus_id text,             -- evidence/guideline id
  label text,
  url text
)
```

### 3.2 RLS

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `report_templates` | authenticated (active) | admin, author | admin | admin |
| `structured_reports` | owner; moderator if public case link | owner | owner (draft/edited) | owner |
| `report_citation_links` | via report owner | via report owner | — | owner |

### 3.3 Индексы

- `structured_reports (user_id, status, updated_at DESC)`
- `structured_reports (study_id)` partial where study_id not null
- GIN on `input_json` → `orads_category`, `iota_codes` (generated columns v2)

### 3.4 Reuse existing

- `patients`, `studies` — link optional
- `calculator_entries` — snapshot input for audit trail
- **Не ломать** `cases` / teaching tables

---

## 4. API design

### 4.1 REST (Next.js App Router)

| Method | Path | Auth | Body |
|--------|------|------|------|
| GET | `/api/reports/templates?domain=adnex` | session | — |
| GET | `/api/reports/templates/[slug]` | session | — |
| POST | `/api/reports/generate` | session + rate limit | `{ templateSlug, input, locale }` |
| POST | `/api/reports` | session | create draft |
| PATCH | `/api/reports/[id]` | owner | `{ editedBlocks, status }` |
| GET | `/api/reports/[id]` | owner | — |
| POST | `/api/reports/[id]/export/pdf` | owner + PRO optional | — |

### 4.2 Zod contracts (`@repo/types`)

```
ReportTemplateSchema
StructuredReportInputSchema   -- per domain extends base
StructuredReportOutputSchema
GenerateReportRequestSchema
```

### 4.3 Generate flow

```
Client input (Zod parse)
  → packages/report-engine (pure TS)
  → { description, impression, recommendations, citations }
  → optional AI polish (POST /api/ai/structured-report) — OFF by default
  → return editable blocks
```

---

## 5. Service architecture

```
┌─────────────────────────────────────────────────────────┐
│  apps/web UI          apps/mobile UI                     │
│  ReportWorkspace      ReportScreen                       │
└────────────┬────────────────────┬────────────────────────┘
             │                    │
             ▼                    ▼
┌─────────────────────────────────────────────────────────┐
│  @repo/report-engine (NEW — shared)                      │
│  ├── templates/        JSON + Zod field meta             │
│  ├── renderers/        description | impression | rec    │
│  ├── i18n/             ru.json, en.json                  │
│  └── citations/        bridge to evidence-corpus         │
└────────────┬────────────────────────────────────────────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
@repo/orads-us    @repo/adnex-education
@repo/thyroid-tirads   packages/medical-calculations
    (classification)     (measurements)
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  Supabase: structured_reports + RLS                      │
│  Storage: report-pdf-exports (optional)                    │
└─────────────────────────────────────────────────────────┘
```

### 5.1 Engine modules (packages/report-engine)

| Module | Responsibility |
|--------|----------------|
| `normalizeInput` | Unify O-RADS wizard + manual fields |
| `composeDescription` | Morphology + measurements prose |
| `composeImpression` | Category + risk band |
| `composeRecommendations` | Management from guidelines |
| `mergeEdits` | User overrides |
| `toDocumentSpec` | PDF via existing `document-spec-builders` |

---

## 6. Web flow

```
/calculators/o-rads  OR  /workspace/[studyId]/report
        │
        ▼
[Select template: Adnex O-RADS]
        │
        ▼
[Form sections: Patient context | Measurements | Morphology | IOTA | O-RADS]
        │  live Zod validation
        ▼
[Generate] → 3-column preview (Description | Impression | Recommendations)
        │  each block editable (rich text lite)
        ▼
[Save draft] → Supabase structured_reports
        │
        ▼
[Finalize] → PDF + link to patient/study
```

**UI reuse:** `Card`, `Tabs`, clinical tokens, `SonogynCopilot` sidebar for wording help (PRO).

---

## 7. Mobile flow

```
GynQuickAccess → O-RADS Wizard (exists: OradsWizardScreen)
        │
        ▼
[Complete wizard] → "Сформировать протокол" CTA
        │
        ▼
ReportPreviewScreen (NEW)
  - same @repo/report-engine output
  - offline: cache draft AsyncStorage → sync on online
        │
        ▼
Share PDF / copy to clipboard
```

**Parity rule:** `walkOradsDecisionTree` from `@repo/orads-us` — single source on both platforms.

---

## 8. Multilingual

| Layer | Strategy |
|-------|----------|
| Template field labels | i18n keys in `@repo/report-engine/i18n` |
| Generated prose | template strings with ICU placeholders |
| Citations | locale-specific label; URL language-agnostic |
| User edits | stored as-is in `edited_blocks` |

---

## 9. Evidence references

- Pull from `@repo/evidence-corpus` + `@repo/clinical-guidelines`
- Citation shape: `{ id, standard, version, section, url, quote? }`
- Footer: *«Не диагноз. Интерпретация — лечащий специалист.»*

---

## 10. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Duplicate logic vs adnex-consensus | Drift | SRE wraps existing packages, not reimplements |
| AI hallucination in impression | Medico-legal | Rule-based core; AI optional overlay |
| Large JSON templates | Slow mobile | Template versioning + lazy load |
| RLS leak via study_id | IDOR | `requireStudyAccess` middleware pattern |
| i18n medical accuracy | Wrong EN terms | Radiologist review gate for en strings |

---

## 11. Dependencies (implementation order)

1. `@repo/types` — Zod schemas
2. `@repo/report-engine` — pure renderers (adnex v1)
3. Web UI — ReportWorkspace
4. API routes + Supabase migration
5. Mobile ReportPreviewScreen
6. PDF export wire-up

**Estimated:** 6–8 tasks × ≤4h (see review_and_roadmap.md)

---

## 12. Approval checkpoint

- [ ] Одобрен контракт `StructuredReportDocument`
- [ ] Одобрен scope v1 (adnex + thyroid + obstetric)
- [ ] Одобрена новая таблица vs расширение `studies.protocol`

**После ✅ → STEP 5 implementation plan → STEP 6 task 1 only**
