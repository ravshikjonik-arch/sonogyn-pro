# 04 — Medical Evidence Integrity

## Принцип продукта (VERIFIED в коде)

Evidence — **не** «свободный LLM». Пайплайн:

1. **Retrieval** (`searchEvidenceUnified` / evidence-retrieval adapters) — источники.  
2. **Rules fallback** `synthesizeEvidenceAnswer` — без LLM.  
3. **Optional LLM synthesis** `synthesizeWithLlm` — JSON только по citations.  
4. Chat Evidence mode: system prompt `buildEvidenceModeSystemPrompt` — только предоставленный контекст.  
5. **Insufficient** → `isInsufficientEvidence` → static reply, без тактики.

CDS disclaimer / «не диагноз» — в prompts и disclaimers retrieval.

---

## Что сохраняется при смене провайдера

| Артефакт | Сохраняется? | Где | Статус |
|----------|---------------|-----|--------|
| Retrieval corpus / citations | Да (до LLM) | evidence-retrieval | VERIFIED |
| System medical instructions (evidence) | Да — один prompt builder | `evidence-context.ts`, `synthesize-llm.ts` | VERIFIED |
| Classification edition hints (O-RADS, BI-RADS, TI-RADS, FIGO, IOTA) | Да, по regex query | `classificationVersionHintsForQuery` | VERIFIED |
| Обязательные citations в UI payload | Да — из searchResult; LLM translations фильтруются по id | `synthesize-llm.ts` ≈188–195 | VERIFIED |
| Запрет выдуманных PMID/КР | Prompt-level | system strings | PARTIALLY (модель может нарушить; есть filter id) |
| Post-parse structure | JSON schema soft + fallback rules | `normalizeClaims`, `withClaims` | VERIFIED |
| Provider-specific prompt fork | **Нет** | Один prompt на всех | VERIFIED (хорошо для паритета) |
| Hard guarantee «provider не может снять evidence mode» | **Нет enforcement layer** | Только prompts + retrieval | RISK residual |

---

## Риск: fallback → «обычная генерация без источников»

| Путь | Риск |
|------|------|
| `gatewayChatCompletion` fail → `synthesizeEvidenceAnswer` rules | **Низкий** — остаётся retrieval-based answer | VERIFIED |
| LLM JSON parse fail → catch → rules fallback | **Низкий** | VERIFIED |
| Chat Evidence с citations → второй LLM игнорирует system | **Средний** — модель-зависимо; prompt жёсткий; нет server-side citation enforcement на финальном markdown | PARTIALLY / RISK |
| Clinical mode + `includeEvidence` hints | EBM supplement в system; не полный Evidence mode | VERIFIED |
| Clinical mode без evidence | Классификации OB/GYN prompts; **не** citation-mandatory | VERIFIED by design |

**Вывод:** failover провайдера **не переключает** режим на «голый chat» автоматически; **теряется** только LLM-синтез (откат к rules). Финальный narrative LLM в Evidence chat **может** галлюцинировать вопреки prompt — mitigation неполный.

---

## Доменные политики

| Область | Отдельная политика? | Файл |
|---------|---------------------|------|
| Акушерство | Clinical system prompt bundle | `system-prompt-obstetric.ts` |
| Гинекология | Clinical system prompt | `system-prompt-gynecology.ts` |
| Evidence EBM | Отдельный mode + retrieval | `evidence-context.ts`, synthesize |
| Маммология / УЗИ | Classification hints + assist routes / imaging-cds | hints + `breast-*`, imaging-cds |
| Отдельный RBAC «evidence policy per specialty» | **Нет** | — |

---

## Prompt injection / safety

- `detectPromptInjection` на user text в chat — heuristic. **PARTIALLY**.  
- Tools ACL в clinical AI SDK — отдельно; Evidence mode без images/tools в основном.  
- HTTP 200 ≠ medical correctness — аудитом зафиксировано явно.

---

## Рекомендации

1. Server-side: финальный Evidence answer обязан содержать ≥1 citation marker если `citations.length>0`, иначе strip/flag.  
2. Не слать Evidence synthesis на Colibri без JSON/`json_object` проверки (уже `jsonObject: true` для Colibri/OR).  
3. Telemetry: `provider` + `synthesisMode` + `evidenceStrength` на каждый ответ (частично есть в logs).  
4. Не считать смену модели клиническим регрессом без golden-set тестов (см. `10_TEST_PLAN.md`).

**Итог:** медицинская оболочка Evidence **в целом сохраняется при смене провайдера**; главная угроза — **не failover**, а **второй LLM narrative** и отсутствие жёсткой post-validation citations в chat markdown.
