# Universal Morphology Foundation

**Package:** `@repo/morphology-core` (`packages/morphology-core`)  
**Status:** TASK 03 — implemented, not wired into Web/Mobile UI or MI Orchestrator  
**Basis:** [`SONOGYN_MEDICAL_INTELLIGENCE_BLUEPRINT.md`](./SONOGYN_MEDICAL_INTELLIGENCE_BLUEPRINT.md) §5, [`SONOGYN_MEDICAL_INTELLIGENCE_ADR.md`](./SONOGYN_MEDICAL_INTELLIGENCE_ADR.md) ADR-MI-02/03/06/08/09

---

## 1. Purpose

One shared, typed representation of morphological findings that text extraction, structured forms, and (later) AI Vision can produce, and that existing classification engines can consume through adapters.

The layer **describes** findings. It does **not**:

- compute any category, score, or risk;
- change engine thresholds, formulas, or rules;
- merge classification systems (ACR TI-RADS ≠ RU TI-RADS, BI-RADS US ≠ BI-RADS MMG);
- fill absent findings with defaults.

Engines remain the single source of truth: `@repo/orads-us`, `@repo/birads-us`, `@repo/tirads-acr`, `@repo/musa-framework`.

---

## 2. Architecture decisions made in this phase

| Decision | Reason |
|----------|--------|
| New package `@repo/morphology-core` | Location agreed in Blueprint §5.5 / ADR-MI-02; keeps contracts out of `apps/*` so Web and Mobile import the same types |
| Engines imported with `import type` only | Zero runtime coupling; no engine code is executed or bundled by the adapters |
| No runtime dependencies (no Zod) | RN-safe; mobile does not declare `zod`. Zod belongs to future MI API boundaries (Phase C) |
| One feature per observation, grouped by `subjectId` | Matches TASK 03 schema; lets each feature carry its own status/provenance |
| Feature ids namespaced per lexicon (`adnexa.*`, `breast_us.*`, `thyroid.acr_*`, `uterus.*`) | Prevents silent merging of criteria that share a word but not a definition |
| Clinical context (menopause, age, cycle day, centre type) kept outside morphology | They are not morphological findings; passed as a separate adapter argument |
| Adapters accept only `confirmed` by default | AI suggestions cannot reach an engine unless the caller opts in, and then every use is warned |

### Contradictions found between TASK 03 and the Blueprint (recorded, not silently resolved)

| # | Blueprint | TASK 03 | Applied | Follow-up |
|---|-----------|---------|---------|-----------|
| C1 | Phase A = SSOT map; Phase B = Morphology Adapter | "Phase A: Universal Morphology Foundation" | Implemented the morphology scope; **no** SSOT code consolidation (Hadlock, FIGO, cervix) was touched | Rename phases on approval |
| C2 | §5.5 morphology-core "depends on nothing clinical-math" | Adapters must emit engine input types | `import type` only — no runtime import of any engine | Keep as rule; review if a runtime mapper is ever needed |
| C3 | §11.2 statuses `observed / inferred / missing / not_applicable` | Six statuses | TASK 03 six statuses | Amend Blueprint §5.4 / §11.2 |
| C4 | §11.2 provenance `physician / nlp / llm / vision / engine_import` | Five sources | TASK 03 five sources | Amend Blueprint |
| C5 | §11.2 observation holds an array of feature values | Flat observation with `feature` + `value` | TASK 03 flat model | Amend Blueprint |
| C6 | §5.3 generic dimensions (`echogenicity`, `margin`, …) | "Не объединяй разные критерии" | Lexicon-namespaced ids; no cross-modality `echogenicity` | Cross-lexicon synonym map = later, per-pair clinical review |

Mapping for C3/C4:

| Blueprint term | Foundation term |
|----------------|-----------------|
| observed | `confirmed` |
| inferred | `suggested` (AI / imported) or `uncertain` |
| missing | `not_assessed` |
| not_applicable | `not_applicable` |
| — | `contradicted` (new) |
| physician | `physician_input` |
| nlp / llm | `ai_text_extraction` |
| vision | `ai_vision` |
| engine_import | `structured_protocol` or `imported_data` |

---

## 3. Canonical schema

Source: `packages/morphology-core/src/types.ts`.

### 3.1 `MorphologyObservation`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | yes | Unique within a set |
| `subjectId` | `string \| null` | no | Groups one lesion / nodule / uterus |
| `anatomy` | `MorphologyAnatomy` | yes | Must equal the feature definition's anatomy |
| `feature` | `string` | yes | `featureId` from the registry |
| `value` | `MorphologyValue \| null` | yes (nullable) | Qualitative payload |
| `status` | `MorphologyStatus` | yes | See §5 |
| `source` | `MorphologyProvenance` | yes | See §4 |
| `confidence` | `ExtractionConfidence \| null` | no | Extractor confidence only |
| `laterality` | `left \| right \| bilateral \| midline \| not_applicable` | no | |
| `plane` | `ImagingPlane` | no | |
| `measurement` | `number \| null` | no | Quantitative payload |
| `unit` | `MeasurementUnit \| null` | no | Must equal the definition unit |
| `timestamp` | ISO-8601 `string` | yes | |
| `classificationContext` | `ClassificationContextId[]` | no | Which engines the observation was recorded for |
| `definitionVersion` | `string` | no | Definition version used |
| `alternatives` | `MorphologyValue[]` | when `contradicted` | ≥ 2 |
| `confirmation` | `{ by: "physician"; at }` | when AI source is `confirmed` | |
| `rawText` | `string` | no | Verbatim source span (audit) |

`MorphologyValue` = `enum {code}` · `enum_set {codes[]}` · `boolean {present}` · `text {text}` —
plus two **alternative-only** kinds (TASK 04.1, ADR-MI-17): `quantity {value, unit}` and `not_assessed {}`,
valid only inside `alternatives` of a `contradicted` observation.  
Quantities use `measurement` + `unit` (value stays `null`). `alternatives` require `status: contradicted`.

### 3.2 `MorphologyFeatureDefinition`

`featureId`, `displayName`, `anatomy`, `valueType`, `allowedValues?`, `unit?`, `applicableClassifications`, `definitionVersion`, `sourceReference`, optional `definition`, `synonyms`.

New features are added with `registry.extend([...])` — the base contract does not change. The registry rejects duplicate ids, quantities without a unit, and enums without allowed values.

---

## 4. Provenance rules

| Source | Meaning | Default status when imported from an engine input |
|--------|---------|----------------------------------------------------|
| `physician_input` | Typed / selected by a clinician | `confirmed` |
| `structured_protocol` | Existing structured form / calculator state | `confirmed` |
| `ai_text_extraction` | LLM or rule NLP from free text | `suggested` |
| `ai_vision` | Image model | `suggested` |
| `imported_data` | External system | `suggested` |

Rules enforced by `validateObservation`:

1. An AI-sourced observation may be `confirmed` **only** with an explicit `confirmation` record.
2. `suggested` is reserved for `ai_*` and `imported_data`; physician input is `confirmed` or `uncertain`.
3. `confirmObservation()` keeps the original `source` and `confidence` — confirmation never rewrites who proposed the finding.
4. `confidence.score` ∈ [0, 1] and describes extraction only. No code path promotes a status based on confidence.
5. **Review state is orthogonal to status** (ADR-MI-18): `isPendingReview(obs)` ⇔ AI source and no
   `confirmation`, for every status. Adapters exclude pending observations unless the caller opts into drafts.
   `acceptObservationStatus(obs, at)` records physician acceptance of a `not_assessed` / `not_applicable` /
   `uncertain` state without turning it into a value; `confirmObservation` accepts a value.

---

## 5. Uncertainty and absence rules

| Status | Value | Meaning | Reaches engine by default |
|--------|-------|---------|---------------------------|
| `confirmed` | required | Assessed; authoritative. A negative value = assessed and absent | yes |
| `suggested` | required | Proposed, not accepted | no (opt-in, warned) |
| `uncertain` | optional | Assessed, reader unsure | no (opt-in, warned) |
| `not_assessed` | forbidden | Not evaluated | no — field stays `undefined` |
| `not_applicable` | forbidden | Does not apply | no (except where the engine lexicon has an explicit N/A value) |
| `contradicted` | forbidden; `alternatives` ≥ 2 (may include `quantity` / `not_assessed` kinds) | Sources disagree | no — **blocks** the conversion |

Example of the critical distinction (O-RADS papillae):

```json
{ "feature": "adnexa.papillary_projection_count", "status": "confirmed", "value": { "kind": "enum", "code": "0" } }
```
→ `papillaryProjectionCount: "0"` (assessed, absent).

```json
{ "feature": "adnexa.papillary_projection_count", "status": "not_assessed", "value": null }
```
→ field omitted; listed in `notAssessed`; never converted to `"0"`.

---

## 6. Supported features (v1.0.0)

| Namespace | Anatomy | Features | Engine |
|-----------|---------|----------|--------|
| `adnexa.*`, `pelvis.*` | adnexa, pelvis | localization, lesion_kind, physiological_type, normal_ovary_pattern, structure, unilocular_subtype, septa_count, septa_thickness, incomplete_septum, solid_component, solid_component_contour, cyst_content_echogenicity, lesion_length/width/height (mm), blood_flow, iota_lesion_type, papillary_projection_count, papillary_projection_surface, largest_solid_component_diameter (mm), locules_over_10, acoustic_shadows, iota_color_score, ascites, peritoneal_nodules | O-RADS US Pro |
| `breast_us.*` | breast | finding_type, mass_shape, mass_orientation, mass_margin, echo_pattern, posterior_features, vascularity, non_mass_echogenicity, non_mass_distribution, non_mass_associated_features | BI-RADS US |
| `thyroid.acr_*`, `thyroid.*`, `neck_lymph_nodes.*` | thyroid, neck | acr_composition, acr_echogenicity, acr_shape, acr_margin, acr_echogenic_foci (set), nodule_largest_diameter (mm), gland_volume (ml), parenchyma_echogenicity (text), parenchyma_vascularity (text), nodule_location (text), lymph node assessment | ACR TI-RADS |
| `uterus.*` | uterus | myometrial_cysts, hyperechogenic_islands, subendometrial_lines_buds, heterogeneous_myometrium, wall_asymmetry, globular_shape, fan_shaped_shadowing, jz_thickness_max (mm), adenomyosis_localization (set), adenomyosis_depth, adenomyosis_morphotype, jz_irregularity, serosal_contour, anterior/posterior_wall_thickness (mm) | MUSA adenomyosis |

Total: 61 definitions. Codes mirror each engine's lexicon; the only normalization in v1 is O-RADS cyst echogenicity (`hypoechoic/isoechoic/hyperechoic` ↔ engine `hypo/iso/hyper`).

`adnexa.blood_flow` and `adnexa.iota_color_score` are deliberately separate features (two engine fields), not merged.

---

## 7. Adapter map

| Adapter | To engine | From engine | Engine type (unchanged) |
|---------|-----------|-------------|-------------------------|
| O-RADS US Pro | `toOradsProInput(obs, context, options)` | `fromOradsProInput(input, options)` | `OradsInput` (`@repo/orads-us/pro`) |
| BI-RADS US | `toBiradsUsInput(obs, options)` | `fromBiradsUsInput(input, options)` | `BiradsInput` (`@repo/birads-us`) |
| ACR TI-RADS | `toTiradsAcrInput(obs, options)` | `fromTiradsAcrInput(input, options)` | `TiradsAcrInput` (`@repo/tirads-acr`) |
| MUSA adenomyosis | `toMusaAdenomyosisInput(obs, options)` | `fromMusaAdenomyosisInput(input, options)` | `MusaAdenomyosisAssessmentInput` (`@repo/musa-framework`) |

`ToEngineResult` is either `{ ok: true, input, usedObservationIds, warnings, notAssessed, notApplicable, completeness, incompleteFeatures }` or `{ ok: false, missing, errors, warnings }`.

O-RADS v2022 grid input is obtained by the **existing** `mapProInputToUs2022(toOradsProInput(...).input)`; the adapter does not reimplement it.

### 7.1 Completeness gate (added in TASK 04 Phase A review)

Verified engine behaviour on missing data (engines unchanged):

| Engine path | Missing input | Engine behaviour | Adapter now |
|-------------|---------------|------------------|-------------|
| `calculateORADS` | `lesionKind` | falls through to a placeholder **category 3** ("Недостаточно структурированных признаков") | **hard missing** — blocks even with `allowPartial` |
| `calculateORADS` → v2022 grid | size, `structure` (or classic subtype) | grid `category: null` → Pro wrapper returns **category 3** ("Нужны данные для расчёта") | **hard missing** |
| `mapProInputToUs2022` | solid component, contour, papillae, shadows, ascites, peritoneal nodules, cyst echogenicity, colour score | silently → `false` / `smooth` / `"0"` / `none` / `nonSimple` / `null` | **must state** — blocks unless `allowPartial: true` |
| `calculateAdenomyosisScore` | JZ thickness | JZ > 12 mm item counts 0 points | **must state** (measurement) |
| `decideFnaAndFollowUp` | nodule size | `fnaRecommended: false` for TR3–TR5 | **must state** |
| `evaluateBirads` | any descriptor | type requires all strings | already **hard missing** |

Rules:

- *Must state* = resolved by a confirmed observation **or** explicitly `not_applicable` (clinician declares it irrelevant). `not_assessed` does not count — the engine would still default it.
- Default (`allowPartial` absent/false): incomplete ⇒ `{ ok: false, errors: [incomplete_for_engine], missing: [...] }`.
- `allowPartial: true` ⇒ `{ ok: true, completeness: "partial", incompleteFeatures: [...] }` + `engine_default_risk` warning. Intended for drafts only; a consumer must never present a partial result as a final category.
- The lists are derived from reading the existing mapper/engines — no engine logic is reimplemented, no threshold changed.

### Issue codes

| Code | Severity | When |
|------|----------|------|
| `invalid_observation` | error | Registry / invariant validation failed |
| `missing_required` (via `missing[]`) | error | Engine-required feature absent / not confirmed |
| `conflicting_values` | error | Two accepted observations disagree |
| `unsupported_value` | error | Canonical code has no engine equivalent |
| `unsupported_transformation` | error or warning | Engine cannot represent the state (e.g. BI-RADS non-mass with N/A mass descriptors; `midline` laterality for O-RADS) |
| `contradicted` | **error** (TASK 04.1) | Any contradicted feature in scope blocks — excluding it would let the engine default it |
| `not_confirmed_excluded` | warning | Only suggested/uncertain present |
| `non_confirmed_used` | warning | Caller opted in to drafts |
| `incomplete_for_engine` | error | A must-state feature is not stated (see §7.1) and `allowPartial` is not set |
| `engine_default_risk` | warning | `allowPartial: true` and the engine will default unstated features |
| `unsupported_feature` | warning | Observation not consumed by this engine |
| `laterality_conflict` | **error** (TASK 04.1) | Observations of one finding disagree on side |
| `inconsistent_features` | error | O-RADS: papillae stated with `solidComponent = false` — the existing mapper would discard them (ADR-MI-19) |
| `lossy_field` | info (from-engine) | Engine field not representable |

---

## 8. Conversion limitations (potential information loss)

| Adapter | Limitation |
|---------|-----------|
| O-RADS | `customDescription` (free text) not represented. Clinical context is returned separately, not as observations. `ovarySide` ↔ laterality; `midline` / `not_applicable` cannot map. Missing-data handling: see §7.1 (hard missing + must-state gate) |
| BI-RADS US | `BiradsInput` requires mass descriptors even for `non_mass`; N/A mass descriptors are refused rather than invented. Lexicon is the local SonoGyn ruleset (ACR + Фисенко) |
| ACR TI-RADS | `patternId` not represented. Parenchyma / location are free text. Lymph nodes are a single summary value. `composition: no_nodule` is an engine pseudo-value kept as-is. Missing size blocks (§7.1) |
| MUSA | Required booleans are never defaulted — `not_assessed` blocks the score. Missing JZ measurement blocks (§7.1). `jzThicknessMm: null` and `localization: []` collapse to "not provided" |
| All | Engine `null` vs `undefined` is not preserved; reported as `lossy_field` |

Round-trip (engine → canonical → engine) is lossless for all supported fields; this is covered by tests.

---

## 9. Examples

### Free-text scenario (Blueprint §7.1) as confirmed observations

«В левом яичнике образование округлой формы 45 мм, с анэхогенным содержимым, … папиллярным разрастанием 6 мм».

```json
[
  { "id": "o1", "subjectId": "L1", "anatomy": "adnexa", "feature": "adnexa.structure", "value": { "kind": "enum", "code": "unilocular" }, "status": "confirmed", "source": "physician_input", "laterality": "left", "timestamp": "2026-11-06T09:00:00Z" },
  { "id": "o2", "subjectId": "L1", "anatomy": "adnexa", "feature": "adnexa.cyst_content_echogenicity", "value": { "kind": "enum", "code": "anechoic" }, "status": "confirmed", "source": "physician_input", "laterality": "left", "timestamp": "2026-11-06T09:00:00Z" },
  { "id": "o3", "subjectId": "L1", "anatomy": "adnexa", "feature": "adnexa.lesion_length", "value": null, "measurement": 45, "unit": "mm", "status": "confirmed", "source": "physician_input", "laterality": "left", "timestamp": "2026-11-06T09:00:00Z" },
  { "id": "o4", "subjectId": "L1", "anatomy": "adnexa", "feature": "adnexa.papillary_projection_count", "value": { "kind": "enum", "code": "1" }, "status": "suggested", "source": "ai_text_extraction", "confidence": { "score": 0.8, "method": "model_self_report" }, "rawText": "папиллярным разрастанием", "laterality": "left", "timestamp": "2026-11-06T09:00:00Z" },
  { "id": "o5", "subjectId": "L1", "anatomy": "adnexa", "feature": "adnexa.iota_color_score", "value": null, "status": "not_assessed", "source": "physician_input", "timestamp": "2026-11-06T09:00:00Z" }
]
```

`toOradsProInput(obs, { menopause: "pre" })` → **blocked** (v0.2 completeness gate):

```json
{
  "ok": false,
  "missing": ["adnexa.lesion_kind"],
  "errors": [],
  "warnings": [{ "code": "not_confirmed_excluded", "featureId": "adnexa.papillary_projection_count" }]
}
```

Without `lesionKind`, `calculateORADS` would return a placeholder category 3, so this is a hard requirement. After the physician adds `lesion_kind = nonphysiological`, the result is still `ok: false` with `incomplete_for_engine` listing solid component, contour, papillae, shadows, colour score, ascites, peritoneal nodules — until each is confirmed or marked `not_applicable` (or the caller explicitly requests `allowPartial`).

The suggested papillae are **excluded** until a physician confirms them (`confirmObservation`). "Неоднородная структура" has no direct O-RADS Pro field and is reported as an unresolved mention by the extraction layer (`AI_TEXT_EXTRACTION.md`).

---

## 10. Web / Mobile compatibility

| Check | Result |
|-------|--------|
| No Node / DOM globals in `src` (excluding tests) | verified (grep) |
| `tsconfig` with `types: []`, `lib: ES2020` | passes |
| Typecheck under `apps/mobile/tsconfig.json` (Expo base) | passes |
| Typecheck under `apps/web/tsconfig.json` (Next) | passes |
| Metro resolution | `apps/mobile/metro.config.js` resolves any `@repo/*` via `exports` → works without config change |
| Next resolution | `@repo/morphology-core` added to `transpilePackages` and `apps/web` dependencies in TASK 04 (server-side extraction runner) |
| Platform-specific duplicate types | none — single package |

Note: `@repo/musa-framework` has no `"type": "module"`, so plain Node ESM sees it only through the CJS default export. Bundlers (Next, Metro) are unaffected; adapters import MUSA as types only.

---

## 11. Tests

`packages/morphology-core/src/__tests__/` — 45 tests (including 7 `SAFETY:` completeness-gate tests); extraction adds 70 more (`src/extraction/__tests__/`, incl. 31 TASK 04.1 semantic-integrity tests — see `AI_TEXT_EXTRACTION.md`), **115 total**:

- serialization round-trip and malformed input;
- all six statuses and their invariants;
- confirmed negative vs `not_assessed`;
- provenance preservation through `confirmObservation`;
- uncertainty survives serialization;
- registry extension, duplicates, namespace separation (BI-RADS US vs MMG, ACR vs RU);
- each adapter: canonical → engine input accepted by the **existing** engine function, no defaults for missing data, conflicts/contradictions, lossless round-trip, explicit refusal of unsupported transformations.

Run: `pnpm test:morphology-core` (CI step "Morphology core"). The package script quotes the glob (`"src/**/*.test.ts"`) so Node expands it recursively; unquoted, `sh` would only reach one directory level and skip the extraction tests.

---

## 12. Not supported yet

- IOTA ADNEX / LR2 / Simple Rules direct adapters (features exist for the O-RADS Pro IOTA fields; existing `mapSreToAdnexInput` and mobile mappers stay authoritative until reviewed).
- BI-RADS MMG (`breast_mmg.*` namespace reserved), RU TI-RADS (needs its own definitions), LN-RADS.
- FIGO, FMF, obstetric biometry, endometrium, cervix.
- Mapping from `imaging-cds` lexicon into canonical observations. (`OradsExtractedInput` is deliberately **not** mapped into observations — it infers negatives from absence; it is used only as a cross-check, see `AI_TEXT_EXTRACTION.md`.)
- Cross-lexicon synonym resolution (e.g. thyroid vs breast echogenicity).

---

## 13. Next integration steps (require separate approval)

1. ~~Add `pnpm test:morphology-core` to the root scripts and CI~~ — done (TASK 04).
2. ~~NLP ingress~~ — done as AI text extraction (`AI_TEXT_EXTRACTION.md`).
3. Vision ingress: `imaging-cds` lexicon ids → observations with `ai_vision`.
4. IOTA adapter reusing `mapSreToAdnexInput`; RU TI-RADS definitions + adapter.
5. MI Orchestrator (Blueprint Phase C) consuming `ToEngineResult` and routing to `executeClinicalTool`; must refuse to display `completeness: "partial"` as a final category.
6. ~~Amend Blueprint for contradictions C1–C6~~ — done (Blueprint v0.2 §18).
