# ADR — SonoGyn Medical Intelligence

**Document:** `SONOGYN_MEDICAL_INTELLIGENCE_ADR.md`  
**Status:** Proposed (TASK 02) — awaiting TASK 03 / Phase A GO  
**Date:** 2026-11-06  
**Blueprint:** [`SONOGYN_MEDICAL_INTELLIGENCE_BLUEPRINT.md`](./SONOGYN_MEDICAL_INTELLIGENCE_BLUEPRINT.md)  
**Supersedes / extends:** does not replace [`adr/ADR-ORCH-evidence-retrieval.md`](./adr/ADR-ORCH-evidence-retrieval.md) or [`adr/ADR-VEC-pgvector-first.md`](./adr/ADR-VEC-pgvector-first.md); aligns with them.

---

## Context

TASK 01 showed SonoGyn Pro already contains:

- Deterministic classification engines in `packages/*`
- AI Gateway + tool calling (`executeClinicalTool`)
- Evidence retrieval (+ optional Medical Vault)
- Fragmented morphology vocabularies (Pro / NLP / lexicon)
- Feedback signals that are **not** a training pipeline
- Vision assist stubs, not a CV product

The product goal is **Medical Intelligence** without building a second platform.

---

## Decision record

### ADR-MI-01 — Orchestrate, do not fork the platform

**Decision:** Introduce a thin **MI Orchestrator** that coordinates existing engines, evidence, gateway, and a new morphology adapter. Do not create a parallel “SonoGyn AI app” with its own calculators or RAG stack.

**Why:** TASK 01 reuse matrix shows high maturity of engines and evidence; duplication is already the main risk.

**Alternatives rejected:**

| Alternative | Why rejected |
|-------------|--------------|
| New monolithic `services/medical-intelligence` Python stack | Breaks web/mobile TS SSOT; duplicates iota/orads |
| LLM-only clinical categories | Non-deterministic; violates CDS safety |
| Replace Evidence with LangChain/LlamaIndex | Conflicts ADR-ORCH |

**Consequences:** New package(s) stay thin; engines remain authoritative for numbers.

---

### ADR-MI-02 — Canonical morphology via Adapter, not a mega-enum

**Decision:** Create **Universal Morphology** as:

1. Feature **definitions** (versioned, scoped by anatomy/modality)
2. **MorphologyObservation** instances
3. **Adapters** to/from O-RADS Pro, NLP extract, vision lexicon, TI-RADS namespaces, etc.

Do **not** collapse ACR TI-RADS and RU TI-RADS into one echogenicity scale.

**Why:** Three O-RADS-adjacent vocabularies already drift (`OradsInput` vs `OradsExtractedInput` vs lexicon IDs). Forced global enums would corrupt thyroid vs ovary semantics.

**Alternatives rejected:**

| Alternative | Why rejected |
|-------------|--------------|
| Pick O-RADS Pro types as the only global schema | Breast/thyroid/MUSA cannot fit cleanly |
| LLM free-form features without schema | Unvalidatable; unsafe for engines |
| DB ontology in Postgres first | Premature; start in package registry |

**Consequences:** `@repo/morphology-core` (proposed); engines keep native inputs; adapter owns mapping tests.

---

### ADR-MI-03 — LLM extracts and explains; engines classify

**Decision:** LLM (and/or rules NLP) may produce structured features. **Category / risk scores** for O-RADS, IOTA, BI-RADS, TI-RADS, FMF percentiles, Bishop, etc. come only from deterministic package functions.

**Why:** Existing `executeClinicalTool` already encodes this; medical liability and regression testing require fixed engines.

**Alternatives rejected:** LLM “suggests O-RADS 3” without engine; engine optional “when confident”.

**Consequences:** Extraction JSON Schema + Zod; UI must confirm inferred features before high-stakes classify when confidence low / missing required fields.

---

### ADR-MI-04 — One Evidence stack; honest abstention

**Decision:** All MI evidence calls go through `@repo/evidence-retrieval` (`searchEvidenceUnified` + existing synthesis/validate). Surface vault disabled/empty explicitly. Never fabricate textbook citations.

**Why:** ADR-ORCH + TASK 01; dual RAG would diverge citations and cost.

**Alternatives rejected:** Per-chat custom vector DB; silent empty vault as “no guidelines exist”.

**Consequences:** MI result type includes `evidence[]` **or** `abstention` + `vaultStatus`.

---

### ADR-MI-05 — SSOT map for duplicated formulas

**Decision:** Freeze ownership:

| Concern | SSOT |
|---------|------|
| EFW Hadlock | `@repo/medical-calculations` |
| FIGO leiomyoma rules | `@repo/myoma-education` calc (`classifyFigo`) |
| FMF T1 percentiles | `@repo/fmf` |
| T2/T3 screening curves | `@repo/obstetric-engine` (+ Medvedev data) |
| ACR TI-RADS | `@repo/tirads-acr` |
| RU TI-RADS | `@repo/thyroid-tirads` (separate engine id) |
| O-RADS US v2022 grid | `@repo/orads-us` `evaluateOradsUs2022` |
| Cervical length (target) | move into `@repo/medical-calculations` |

**Why:** TASK 01 duplication map (Hadlock×2, FIGO×3, z-score×3, TI-RADS×2).

**Alternatives rejected:** “Average” engines; keep all forks indefinitely without labels.

**Consequences:** Phase A documentation + later PRs to wrap/re-export; no big-bang delete.

---

### ADR-MI-06 — Dual TI-RADS remains two engines

**Decision:** `tirads_acr` and `tirads_ru` are separate `EngineId`s with separate versions and UI modes.

**Why:** Different scoring philosophies; merging would produce false “harmonized” categories.

**Rejected:** Single “TI-RADS” with a country flag that remaps points silently.

---

### ADR-MI-07 — Error Learning is gated; no online learning

**Decision:** Separate pipelines:

1. `ai_chat_message_feedback` → UX metrics only  
2. `PhysicianCorrection` (reuse/extend `ai_orads_events`)  
3. `ExpertReview` → only then `TrainingExample`  
4. Versioned train/val/test + `EvaluationRun` + human release  

No automatic update of classification math or production prompts from raw corrections.

**Why:** Thumbs ≠ gold; PHI; clinical safety; TASK 01 gap analysis.

**Rejected:** RLHF-from-chat; auto-fine-tune weekly; writing corrections into O-RADS tree.

**Consequences:** New schemas in Blueprint; DB migrations only with explicit GO in Phase F.

---

### ADR-MI-08 — Vision feeds the same Morphology Adapter

**Decision:** Future vision pipeline ends in **MorphologyObservation**, then engines — identical to text path after physician confirm.

**Why:** Prevent “vision O-RADS” fork; TASK 01 vision readiness is assist-level.

**Rejected:** Separate vision category model; end-to-end LLM image→category without engine.

**Consequences:** IQA/detect/seg are modular; DICOM de-id is a prerequisite for prod vision, not part of Phase C.

---

### ADR-MI-09 — Web/Mobile share contracts; UI may differ

**Decision:** Shared `@repo/*` engines + morphology + MI types. Mobile may call engines offline; LLM/evidence remain server APIs.

**Why:** Existing parity pattern (`orads-us`, `iota-models`, `medical-calculations`).

**Rejected:** Mobile-only recalculation copies; web-only MI types in `apps/web` long-term.

**Consequences:** Prefer `@repo/medical-intelligence` for types/orch core.

---

### ADR-MI-10 — EMR vs teaching vs MI learning stay separated

**Decision:** Align with [`emr-teaching-boundary.md`](./emr-teaching-boundary.md). MI TrainingExamples must not ingest EMR PHI. Teaching/evidence corpora remain separate trust boundaries.

**Rejected:** “Use real patients as default train set”.

**Consequences:** Legal basis field on TrainingExample; PHI guards on export.

---

### ADR-MI-11 — Prefer rules-first for O-RADS protocol text

**Status:** **Amended by ADR-MI-13 (2026-11-06)** for observation creation.

**Decision (original):** Keep `parseOradsProtocolText` / `runOradsAssistPipeline` as primary path for RU protocol-like text; LLM extraction for free narrative / multi-domain.

**Why:** Already tested deterministic assist path; cheaper; less hallucinated features.

**Rejected:** LLM-only extraction for all O-RADS.

**Amendment:** `runOradsAssistPipeline` remains unchanged for its existing UI use. For canonical
morphology observations, `parseOradsProtocolText` is demoted to a cross-check (ADR-MI-13).

---

### ADR-MI-12 — Implementation order locked to phases A→H

**Decision:** Blueprint phases: SSOT → Morphology → Orchestrator → Extraction → Evidence honesty → Error Learning → Vision foundation → Eval.

**Why:** Dependencies (adapter before orch; honesty before “smart RAG marketing”; vision after morphology).

**Rejected:** Vision-first; learning-first; big-bang rewrite of calculator UIs.

---

### ADR-MI-13 — Rule parser is a cross-check, not an observation source

**Status:** Accepted · 2026-11-06 (TASK 04)

**Decision:** AI text extraction creates observations only from model mentions that pass
deterministic validation. `parseOradsProtocolText` runs in parallel and can only add
`rule_parser_disagreement` / `rule_parser_found_unextracted` ambiguities.

**Why:** Reading the parser showed it violates extraction rules 2–3: `vascularity: "none"` on
any «не определяется» in the text, `lesionClass: "simple"` by default for any «киста»,
`ovarySide: "bilateral"` when both words occur anywhere, no source spans, mm-only sizes, and it
misses case forms such as «солидным компонентом».

**Alternatives rejected:** rules-first observations (unsafe negatives); fixing the parser now
(changes behaviour of existing O-RADS assist UI — separate task); dropping it entirely (loses a
cheap independent signal).

**Consequences:** No observation without a verbatim fragment. Parser quality issues are visible as ambiguities.

---

### ADR-MI-14 — Completeness gate in engine adapters

**Status:** Accepted · 2026-11-06 (TASK 04 Phase A review)

**Decision:** Adapters block when an engine or its existing mapper would silently default an
unstated feature (`incomplete_for_engine`), unless the caller passes `allowPartial: true`, which
returns `completeness: "partial"`. Inputs whose absence makes `calculateORADS` produce a
placeholder category 3 are hard requirements regardless of `allowPartial`.

**Why:** Verified: `mapProInputToUs2022` maps absent solid component / contour / papillae /
shadows / ascites to negatives; `calculateORADS` returns category 3 for missing `lesionKind`,
size or structure; MUSA counts missing JZ as 0; TI-RADS FNA becomes `false` without size. A warning
on `ok: true` (TASK 03 behaviour) is too easy to ignore.

**Alternatives rejected:** change engine defaults (forbidden: medical rules); post-hoc parsing of
engine rationale text (fragile); warnings only (silent in practice).

**Consequences:** Clinicians must state or mark `not_applicable` every must-state feature; the
lists are derived from engine code and must be reviewed when engines change.

---

### ADR-MI-15 — Assertion model: where statement certainty lives

**Status:** **Decided · 2026-11-06 (TASK 04.1)** — no `assertion` field on `MorphologyObservation`;
per-statement assertion stays in extraction evidence.

**Context:** TASK 04.1 asked whether `affirmed / negated / suspected / uncertain / conflicting`
needs a first-class observation field.

**Decision — what is stored where:**

| Concept | Stored on the observation | Stored in extraction evidence / ambiguity |
|---------|---------------------------|-------------------------------------------|
| affirmed | `value` (positive) + `status: suggested` | `evidence.assertions[] = "affirmed"` |
| negated | `value` (negative: `present=false`, `"0"`, `"none"`) + `status: suggested` | `"negated"` |
| suspected | `status: uncertain` (+ candidate value) | `"suspected"` + `hedged_statement` ambiguity |
| uncertain | `status: uncertain` (+ candidate value) | `"uncertain"` + `hedged_statement` ambiguity |
| not assessed (stated) | `status: not_assessed`, `value: null` | `"not_assessed"` |
| conflicting | `status: contradicted` + `alternatives` | `conflicting_values` ambiguity; one assertion per fragment |

**Why:**

1. `status` is the *current clinical state* of the finding; an assertion is *how one sentence
   stated it*. After physician confirmation the status becomes `confirmed` while the sentence was
   still "uncertain" — an observation-level `assertion` would then contradict `status`.
2. One observation may aggregate several fragments with different assertions; a single field cannot
   represent that, the evidence array can.
3. "conflicting" is a group outcome, not a statement property.
4. No base-contract change → Phase A adapters and existing round-trips unaffected.

**Consequences:** `ClinicalAssertion = affirmed | negated | suspected | uncertain | not_assessed`
(extraction-level). Prompt v1 `hedged` is accepted as an alias of `uncertain`. Error Learning (Phase F)
must persist evidence together with corrections if statement certainty is needed.

**Alternatives rejected:** optional `assertion` on the observation (desync risk above); encoding in
`rawText` (unstructured); a separate `suspected` status (no engine or reviewer distinguishes it from
`uncertain`; would expand the six-status contract).

---

### ADR-MI-16 — Placement of the extraction layer

**Status:** Accepted · 2026-11-06 (TASK 04)

**Decision:** Shared, provider-agnostic logic in `@repo/morphology-core/extraction` (subpath of
the existing package); the gateway-bound runner in `apps/web/lib/ai/morphology-extraction/`.
No API route in this phase.

**Why:** Avoids a new unagreed package; one implementation for Web and RN contracts; LLM keys
stay server-side; guards and gateway are reused by injection, not copied.

**Alternatives rejected:** new `@repo/mi-extraction` package (not agreed in Blueprint); extraction
in `apps/web` only (mobile cannot share contracts); Zod in the shared package (mobile has no zod
dependency — hand-written strict validation instead; Zod remains mandatory at the future API route).

**Consequences:** `apps/web` depends on `@repo/morphology-core` (added to `transpilePackages`).
Extraction quota usage is checked but not yet logged — to be added with the MI event in Phase C.

---

### ADR-MI-17 — Representing contradictions without choosing a value

**Status:** Accepted · 2026-11-06 (TASK 04.1)

**Context:** Phase B could hold only qualitative contradictions; conflicting sizes (35 vs 48 mm)
were dropped to `unresolvedMentions`, and "not assessed" vs a value had no representation.
Adapters excluded a contradicted feature with a warning, so the engine treated it as absent.

**Decision:**

1. Minimal additive extension of `MorphologyValue` with two **alternative-only** kinds:
   `{ kind: "quantity"; value; unit }` and `{ kind: "not_assessed" }`. Validation rejects them as
   `value`; they are valid only in `alternatives` of a `contradicted` observation, and quantity
   alternatives must use the feature's unit.
2. `alternatives` are allowed only with `status: contradicted`.
3. Adapters treat any `contradicted` observation in scope as a **blocking error** (also with
   `allowPartial`), and a laterality disagreement within one finding as a blocking error.
4. Extraction groups per (subject, feature); any difference — including not_assessed vs value —
   yields one `contradicted` observation with all fragments in evidence.
5. A laterality conflict between a subject and its fragments unsets the side and records
   `laterality_conflict`; the model's side is never kept silently.

**Why:** "Не выбирай одно значение молча" and "не передавай противоречивые данные в адаптеры";
excluding a feature lets engines default it (ADR-MI-14).

**Alternatives rejected:** a separate `contradictions[]` side-structure (two places to look,
observation stream incomplete); keeping quantity conflicts unresolved (contradiction invisible to
adapters); a generic `unknown` value (loses which values conflicted).

**Backward compatibility:** additive union members; all Phase A round-trips unchanged. Exhaustive
`switch` consumers must add two cases (done in `review.ts`).

---

### ADR-MI-18 — Review state is orthogonal to status (explicit not_assessed)

**Status:** Accepted · 2026-11-06 (TASK 04.1)

**Context:** Text may state «не оценивался». The six-status model has no "suggested + not_assessed".

**Decision:** No new status. An observation is **pending review** iff `source` is AI
(`ai_text_extraction`, `ai_vision`) and `confirmation` is absent — `isPendingReview()`. This holds for
every status (suggested, uncertain, not_assessed, contradicted). Extraction emits
`status: not_assessed, value: null, source: ai_text_extraction, confirmation: null, rawText` only when
the fragment contains an explicit not-assessed phrase. Adapters exclude pending observations unless the
caller opts into drafts; `acceptObservationStatus()` records physician acceptance of a
not_assessed / not_applicable / uncertain state without turning it into a value.

**Why:** Keeps the base contract (no new status); fixes a real leak — previously an AI `not_assessed`
lymph-node observation would have been passed to TI-RADS as `lymphNodes: "not_assessed"` without review.

**Alternatives rejected:** new status `suggested_not_assessed` (combinatorial statuses); optional
`reviewStatus` field (duplicates information already in `source` + `confirmation`).

---

### ADR-MI-19 — Papillary projection, solid component and mural component are not interchangeable

**Status:** Accepted · 2026-11-06 (TASK 04.1)

**Decision:**

1. Extraction concept guard (`CONCEPT_CUES`): solid-component features require «солидный» in the
   fragment; papillary features require «папиллярный». Anything else (e.g. «пристеночный компонент»,
   or a papilla size mapped to the solid diameter) → `concept_mismatch`, text preserved.
2. Feature definitions (`adnexa.solid_component`, `largest_solid_component_diameter`,
   `papillary_projection_count`, `papillary_projection_surface`) state this explicitly; definition
   version 1.1.0. O-RADS medical definitions and engine rules are unchanged.
3. O-RADS adapter: papillae stated with `solidComponent = false` → `inconsistent_features` (blocking).
   Grounded in engine code: `mapProInputToUs2022.resolvePapillae` returns `"0"` whenever
   `solidComponent` is false, so the papillae would be silently discarded. The solid component is never
   inferred automatically — the physician states it.

**Why:** Phase B accepted a model mapping «папиллярным разрастанием 6 мм» to solid component + solid
diameter, and «пристеночный компонент» to solid component.

**Alternatives rejected:** auto-setting `solidComponent = true` from papillae (a clinical inference);
synonym tables merging the concepts.

---

### ADR-MI-20 — MI Orchestrator placement; existing Copilot orchestrator untouched

**Status:** Accepted · 2026-11-06 (TASK 05)

**Decision:** The orchestrator lives in `@repo/medical-intelligence` (pure, injectable dependencies,
Web/RN-safe); web bindings in `apps/web/lib/ai/mi/`; endpoint `POST /api/mi/analyze`.
`apps/web/lib/ai/orchestrator.ts` (`runClinicalCopilotOrchestrator`) is **not** extended.

**Why:** The Copilot orchestrator fans out seven LLM/rule agents and merges free-text hypotheses —
a different responsibility. Extending it would mix LLM hypotheses with deterministic, physician-gated
classification. Package placement resolves Blueprint open question #1 (ADR-MI-09).

**Alternatives rejected:** extending the Copilot orchestrator; web-only orchestration (no shared contract for Expo).

---

### ADR-MI-21 — Route classification to engine public APIs, not through `executeClinicalTool`

**Status:** Accepted · 2026-11-06 (TASK 05)

**Decision:** Routing adapters call `calculateORADS`, `evaluateBirads`, `evaluateAcrTirads`,
`calculateAdenomyosisScore` directly with inputs produced by the strict morphology adapters.

**Why (verified):** `executeClinicalTool` validates with `z.object` tool schemas that strip unknown
keys. The same O-RADS input gives category **5** directly and **4** via the tool (echogenicity,
papillae, colour score, shadows, ascites dropped). The TI-RADS tool expects `maxDiameterMm`, the engine
`largestDiameterMm`, so size and the FNA rule are lost. Using it would re-introduce the defaults blocked
in ADR-MI-14.

**Consequences:** The chat tool defect is an existing issue reported for a separate task. Engine
versions are stamped per route (`O-RADS US v2022` mirrors the tool label; others use exported constants).
An O-RADS placeholder output is treated as abstention (defence in depth tied to engine strings).

---

### ADR-MI-22 — Workflow states and outcome semantics

**Status:** Accepted · 2026-11-06 (TASK 05)

**Decision:** Explicit transition table (`MI_TRANSITIONS`); illegal transitions throw. Terminal outcomes:
`incomplete` (insufficient data), `blocked` (policy / safety / invalid request / unsupported engine / quota),
`failed` (technical), `awaiting_physician_review` (physician action), `completed`.
Free text can never reach `classifying` in the same request. Results are normalized to plain JSON.
No partial classification path exists (no agreed scenario guarantees correctness).

**Alternatives rejected:** a single "error" status (conflates medical abstention with outages);
auto-continuation after extraction (bypasses the review gate).

---

### ADR-MI-23 — Reuse of evidence, quota and guards; rollout and idempotency

**Status:** Accepted · 2026-11-06 (TASK 05)

**Decision:**

1. Evidence: the existing chain (quota → `searchEvidenceUnified` → `synthesizeWithLlm` / rules →
   `formatEvidenceSourcedChatReply` → `postValidateEvidenceAnswer`); evidence failure is never shown as
   success; "all providers failed" ≠ "insufficient"; quota refusal = `blocked`.
2. Guards run in the orchestrator on every text field before any provider (and again in extraction).
3. Endpoint behind `MI_ORCHESTRATOR_ENABLED` (default off), authenticated, existing rate limit, Zod schema.
4. Per-user `idempotencyKey` coalescing (60 s, in-memory, per instance) — no persistence in Phase C.

**Small supporting changes (additive, no medical logic):** type-only subpath
`@repo/evidence-retrieval/types`; server-safe subpath `@repo/orads-us/parse-protocol-text` (the package
root re-exports React hooks, which broke the route build); `"type": "module"` for
`@repo/musa-framework` (ESM source without the flag failed named imports in Node and needed a
default-export workaround that produced a webpack warning).

**Known gaps:** MI usage not yet written to `ai_chat_events`; idempotency is per instance; the Evidence
Assistant route itself has no PHI check (reported).

---

### ADR-MI-24 — Chat clinical tools: strict engine-contract schemas

**Status:** Accepted · 2026-11-06 (TASK 05.1) · resolves the defect recorded in ADR-MI-21

**Decision:** Every `executeClinicalTool` schema is `.strict()` and mirrors the public input of its engine;
compile-time checks (`ToolSchemaContractChecks`) fail the build if keys or value types drift. Lexicon enums
come from the engines where they export them (TI-RADS lexicon, BI-RADS ruleset options). Tools return the
full JSON-normalised engine result. Absent findings that an engine reads as "no" are listed in
`notProvided` / `limitations`, never filled in. Input consistency only (no new rules): papillae require an
explicit `solidComponent: true`; two different TI-RADS sizes are rejected; IOTA Simple Rules lists are
required. O-RADS placeholder output is refused via `ENGINE_ROUTES.orads_us_pro.execute` (reused, MI
unchanged) instead of being shown as category 3.

**Compatibility:** `maxDiameterMm` remains a deprecated alias of `largestDiameterMm` (same unit). Result
keys follow engine names (`impression`, `fnaRationale`, `followUpRecommendation`); the former renamed
summary keys (`recommendation`, `fnaRecommendation`, `followUp`) are gone — no code consumed them, the
card renders JSON. MI routing still calls engines directly (ADR-MI-21 unchanged).

---

### ADR-MI-25 — Chat clinical tools: missing-data semantics by engine enumeration

**Status:** Accepted · 2026-11-06 (TASK 05.2)

**Decision:** Missing or `not_assessed` inputs are never filled in. The tool re-runs the SSOT engine over
every value such an input can take (`tools/completeness.ts`, `tools/policies.ts`) and compares engine
outputs only — no thresholds or rules are re-implemented. Each result carries
`completeness.category` and `completeness.recommendation` (`complete | provisional | incomplete`) and a
worst-of `status`:

- **incomplete** → the value is withheld (`ok:false`, or the recommendation fields are removed) with the
  possible engine outcomes; e.g. O-RADS cyst without solid-component / wall-contour data, TI-RADS
  FNA/follow-up without size, a `not_assessed` descriptor that changes the category, BI-RADS ruleset
  fallback (no rule matched), Simple Rules features not assessed, FMF with nothing evaluable;
- **provisional** → shown with `limitations`: O-RADS branch inputs that could only lower the category, or
  ascites/peritoneal nodules not provided (could upgrade 3–4 → 5); TI-RADS FNA=false with lymph nodes not
  assessed; FMF inputs the engine could not evaluate;
- **complete** → identical to the direct engine call.

The chat appends a server notice when the answer states a value whose latest tool result is not complete,
or when the answer is empty (step limit). The card label is text. AI SDK 7 requires the system prompt as
`instructions` (system messages in `messages` throw) — fixed in `runAiSdkStreamText`.

**Alternatives rejected:** requiring every optional field (blocks valid calls where a field cannot change
the outcome); tool-side clinical thresholds (duplicate SSOT logic).

---

### ADR-MI-26 — Chat clinical safety: review gate, structured category, retry integrity

**Status:** Accepted · 2026-11-06 (TASK 05.4, after the real-LLM audit TASK 05.3)

**Decision:**

1. **Provenance (`inputReview`).** Every tool input carries source/state: `model_supplied`, `model_assumed`
   (declared in `assumedFields`, excluded from the calculation), `physician_confirmed`, `not_assessed`.
2. **Review gate** for O-RADS and IOTA (ADNEX, LR2, Simple Rules Risk): the chat boundary withholds the result
   from the model and the card (`review.state = pending`); `/api/ai/tools/confirm` (auth, rate limit, Zod, no
   LLM, no persistence) re-runs the SSOT engine with the fields the physician ticked — unticked fields are dropped.
3. **Validation inside the tool.** The SDK no longer rejects calls; `executeClinicalTool` returns a structured
   `rejected` result with `validationIssues` that reaches the model and the history. A per-turn session rejects a
   retry that drops/changes valid values after a rejection; fields first added on a retry are model assumptions.
4. **Category from the engine only.** The `sonogyn-json` card shows the engine result; a model category is shown
   as "Не рассчитано клиническим движком" or flagged as a mismatch. Status notices are built from `rejected`,
   `review`, `ok`, `status`, `error`, `limitations`; text matching is an auxiliary banner only.
5. **One `not_assessed`.** Categorical / boolean findings of all seven tools accept it; never read as negative
   (enumerated by the engine; IOTA → incomplete with the model's risk range).
6. **Legacy path (no tools).** The prompt states that engines are unavailable and requires `category: null`; the
   card marks any model category as not calculated. Persisted AI SDK answers equal the streamed text of all steps.

**Compatibility:** all result fields are optional additions (`tool_results` is jsonb; mobile does not use
`/api/ai/chat`). `MI` routing abstention reason no longer relays the placeholder `riskText`.

**Known gaps:** confirmation is not persisted (reload shows the pending state again); the physician can tick or
untick fields but not edit values; text-claim detection is pattern-based and auxiliary.

---

## Cross-cutting principles (normative)

1. One SSOT per medical formula.  
2. Independent engines for independent classifications.  
3. One canonical morphology **observation model** (adapters for engines).  
4. LLM ≠ math.  
5. Evidence not invented.  
6. Missing ≠ negative.  
7. Assumed ≠ confirmed.  
8. Physician correction ≠ expert label.  
9. No uncontrolled learning.  
10. Shared contracts Web/Mobile.  
11. Vision → same adapter.  
12. Versioned rules + sources.  
13. Reversible changes (feature flags / soft launch).  
14. PHI out of train sets without legal basis.

---

## Risks

| Risk | Mitigation |
|------|------------|
| Fat orchestrator absorbs business rules | Code review gate; engines only in packages |
| Adapter becomes unmaintainable N×M matrix | Namespace by anatomy; test round-trips per engine |
| Duplicate Hadlock continues silently | Phase A SSOT + lint/test that obstetric-engine imports medical-calculations |
| Vault “looks smart” while empty | Mandatory vaultStatus in MI responses |
| Expert review bottleneck | Start with O-RADS-only correction path |
| DICOM PHI in vision | Block prod vision until de-id GO |
| Migration drift apps/web vs packages/database | Existing `check:migration-drift`; MI migrations only on SSOT tree |

---

## Unresolved questions

1. Exact npm name and home of orchestrator package.  
2. Default MI engine for adnexa: `orads_us_2022` vs keep Pro as chat tool default until UI parity.  
3. Whether IDEA educational score becomes a versioned engine or stays UI-only.  
4. Expert RBAC: extend `is_case_expert` vs `mi_reviewer`.  
5. Retention / consent policy for TrainingExample under RF law (legal, not engineering alone).  
6. Timeline to empty `breast-classification` from MI paths.

---

## Potential conflicts with existing modules

| Module | Conflict | Resolution direction |
|--------|----------|----------------------|
| `executeClinicalTool` uses `calculateORADS` (Pro) | MI prefers v2022 grid | Dual engine ids; migrate chat tool later with tests |
| `obstetric-engine` Hadlock copy | Divergent EFW | Re-export from medical-calculations |
| `thyroid-tirads` vs `tirads-acr` | Both in TiradsProFlow | Keep dual; MI registry both |
| `breast-classification` | Legacy BI-RADS | Exclude from MI registry |
| `clinical-3d` FIGO / FMF anchors | Viz vs calc | Calc SSOT elsewhere |
| Mobile `cervicalLengthAssessment` | Wrong layer | Move to packages |
| `ai_chat_message_feedback` | Misuse as train | Document + enforce in Error Learning |
| `clinical_ai_memory` | Looks like learning | Keep as suggestion memory only |
| Empty dicom-* packages | Name implies capability | Do not advertise until implemented |
| Open-access evidence APIs | Cost/abuse vs MI | Keep existing bot/rate limits; MI analyze auth-required |

---

## Compliance with prior ADRs

| Prior ADR | Relationship |
|-----------|--------------|
| ADR-ORCH evidence-retrieval | **Affirmed** — MI uses same stack |
| ADR-VEC pgvector first | **Affirmed** — vault remains opt-in pgvector |
| ADR-CORE sonogyn kernel | **Affirmed** — packages remain clinical kernel |
| EMR/teaching boundary | **Affirmed** — MI learning ≠ EMR dump |

---

## Approval

| Role | Sign-off |
|------|----------|
| Founder / clinical owner | Pending |
| Architecture (TASK 02) | Draft complete |
| Phase A implementation | **Not started** — wait TASK 03 |

---

## Changelog

| Ver | Date | Notes |
|-----|------|-------|
| 0.1 | 2026-11-06 | TASK 02 initial ADR set ADR-MI-01…12 |
| 0.2 | 2026-11-06 | TASK 04: ADR-MI-11 amended; ADR-MI-13, 14, 16 accepted; ADR-MI-15 proposed |
| 0.3 | 2026-11-06 | TASK 04.1: ADR-MI-15 decided (evidence-level assertion); ADR-MI-17, 18, 19 accepted |
| 0.4 | 2026-11-06 | TASK 05: ADR-MI-20, 21, 22, 23 accepted (orchestrator) |
| 0.5 | 2026-11-06 | TASK 05.1: ADR-MI-24 accepted (chat tool input fidelity) |
| 0.6 | 2026-11-06 | TASK 05.2: ADR-MI-25 accepted (missing-data semantics) |
| 0.7 | 2026-11-06 | TASK 05.4: ADR-MI-26 accepted (review gate, structured category, retry integrity) |
