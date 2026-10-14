# AI Clinical Safety — SonoGyn Pro

## Principle

**AI explains; engines calculate.** Final medical decision always rests with the treating physician.

## Classification rules

| System | AI may | AI must not |
|--------|--------|-------------|
| O-RADS US | Explain tool result, draft protocol | Assign category without `calculate_orads` |
| BI-RADS US | Explain tool result | Invent category without `calculate_birads` |
| ACR TI-RADS | Explain tool result | Sum points or assign TR without `calculate_tirads` |
| FMF I trimester | Explain percentiles | Estimate NT/CRL MoM without `assess_fmf_screening` |

## Tool execution

- Tools run **only on server** (`lib/ai/sonogyn-chat/tools/execute.ts`)
- Input validated with **Zod** before engine call
- Response includes:
  - `engineVersion`
  - `sourceLabel` (package path)
  - `inputEcho` (sanitized)
  - `result` (numeric/category from engine)

## Incomplete data

If required fields are missing, tool returns `ok: false`, `missingFields[]`, and AI must ask clarifying questions — **never fabricate measurements**.

## Evidence / citations

- Clinical mode: optional EBM supplement from evidence corpus (when enabled)
- Evidence mode: citations only from retrieval pipeline — **no hallucinated sources**
- UI shows citation links from `AssistantAnswer.citations`

## UI marking

- All assistant outputs labeled **«AI-черновик · подтверждает врач»**
- Structured JSON block (`sonogyn-json`) for calculator cards — category field must match tool output when tool was invoked

## Disclaimer (mandatory)

> Заключение носит вспомогательный характер и не является диагнозом. Финальное решение — за лечащим врачом.

Embedded in system prompts and `confidence_caveat_ru` in structured response.

## Separation OB / GYN prompts

- **Obstetric** bundle: FMF/ISUOG, biometry, doppler I trimester
- **Gynecology** bundle: O-RADS, BI-RADS, TI-RADS, pelvis/breast

Selected by clinical domain inference (`rag-context.ts`).

## Regression tests

- `lib/ai/__tests__/ai-assistant-hardening.test.ts` — tool ACL, injection, engine wiring

## Out of scope

- Changing medical formulas in `packages/*` engines
- Replacing physician-signed PDF/protocol as source of truth
