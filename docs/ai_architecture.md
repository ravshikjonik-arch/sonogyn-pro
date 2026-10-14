# AI Architecture — SonoGyn Pro

## Scope

Sonogyn AI Copilot (`/api/ai/chat`, `SonogynCopilot.tsx`) — clinical decision support for ultrasound (OB/GYN).  
Patterns inspired by **Vercel AI SDK** and Chatbot architecture; **not** a template fork. Supabase Auth, DB, and UI design remain unchanged.

## Stack

| Layer | Implementation |
|-------|----------------|
| Provider | OpenRouter (vision), Perplexity (text) via `lib/ai/llm-provider.ts` |
| Streaming | Vercel AI SDK `streamText` (opt-in `AI_SDK_ENABLED`) + OpenRouter SSE fallback |
| Tools | AI SDK tools → local engines (`@repo/orads-us`, `@repo/birads-us`, `@repo/tirads-acr`, `@repo/fmf`) |
| Evidence | `@repo/evidence-retrieval` + `synthesizeWithLlm` (EBM mode) |
| Persistence | `ai_chat_sessions`, `ai_chat_messages`, `ai_chat_events` (metadata only in events) |
| Security | PHI gate, prompt-injection heuristics, rate limits, server tool ACL |

## Request flow

```mermaid
sequenceDiagram
  participant UI as SonogynCopilot
  participant API as /api/ai/chat
  participant RL as Rate limit + quota
  participant Guard as PHI + injection
  participant Tools as Clinical engines
  participant LLM as Provider

  UI->>API: POST messages, stream, sessionId
  API->>RL: consumeRateLimit + assertAiChatQuota
  API->>Guard: detectPhi + detectPromptInjection
  API->>API: buildSonogynSystemPrompt (OB/GYN bundle)
  alt AI SDK stream + tools
    API->>LLM: streamText + sonogynClinicalTools
    LLM->>Tools: tool execute (server-only)
    Tools-->>LLM: numeric result + engine version
    LLM-->>UI: text stream + sonogyn-tools trailer
  else OpenRouter fallback
    API->>LLM: callOpenRouterChat (model chain)
    LLM-->>UI: SSE or JSON
  end
  API->>API: logAiChatEvent (no message bodies)
  API->>DB: append ai_chat_messages (owner RLS)
```

## Prompt versioning

- Registry: `lib/ai/sonogyn-chat/prompt-registry.ts`
- Bundles: **gynecology** | **obstetric** | **general**
- Version label stored in `ai_chat_events.prompt_version` and `ai_chat_messages.prompt_version`

## Model fallback

- Chain: `buildModelFallbackChain()` — requested → primary → `AI_CHAT_FALLBACK_MODEL` → default
- Client header: `X-Sonogyn-Model-Fallback: 1`

## Cost control

- Free tier: `assertAiChatQuota()` counts successful `ai_chat_events` (30 days)
- Telemetry: `estimated_cost_usd` from token usage (rough, not billing)

## Privacy

- No patient identifiers sent to model (PHI block)
- `redactForAiLog()` before diagnostic logs
- Sentry scrub extended for `messages`, `content`, `prompt`
- `ai_chat_events` — metadata only (tokens, model, duration)

## Feature flags

| Env | Effect |
|-----|--------|
| `AI_SDK_ENABLED=1` | Server uses AI SDK stream path |
| `NEXT_PUBLIC_AI_SDK_ENABLED=1` | Client parses plain text AI SDK stream |
| `AI_CHAT_FALLBACK_MODEL` | Secondary model id on provider errors |
| `EVIDENCE_CLINICAL_HINTS=1` | Append PubMed/CR hints in clinical mode |

## Key files

- `apps/web/app/api/ai/chat/route.ts`
- `apps/web/lib/ai/sdk/stream-chat.ts`
- `apps/web/lib/ai/sonogyn-chat/tools/*`
- `apps/web/components/ai/SonogynCopilot.tsx`
- `apps/web/supabase/migrations/20260830180000_ai_assistant_hardening.sql`
