# Clinical Speech — rollout по очереди

Ветка: `feature/clinical-speech` → MR в `main`.

## 1. Code (готово в ветке)

- [x] `@repo/clinical-speech` (web STT + postprocess)
- [x] Web `DictationField`, Whisper API, consent, e2e
- [x] Mobile FMF: `MobileDictationBar` + `@repo/clinical-speech` postprocess

## 2. GitLab MR

1. Открыть MR: `feature/clinical-speech` → `main`
2. Title: `feat: clinical speech (STT package, Whisper, mobile FMF dictation)`
3. Checklist в описании:
   - [ ] Preview deploy Vercel
   - [ ] `pnpm --filter @repo/clinical-speech test`
   - [ ] `pnpm --filter @repo/web test:e2e:speech`
   - [ ] `pnpm --filter @repo/mobile test:speech`
   - [ ] Smoke O-RADS + `/ai/consultants/gynecology` (web)
   - [ ] FMF Assistant mic (device, login)

## 3. Vercel (preview + prod)

| Переменная | Назначение |
|------------|------------|
| `OPENROUTER_API_KEY` | Whisper через OpenRouter |
| `OPENROUTER_WHISPER_MODEL` | `openai/whisper-1` (опционально) |
| `OPENAI_API_KEY` | fallback без OpenRouter |
| `NEXT_PUBLIC_SPEECH_STT_MODE` | `auto` (default) |

Rate limits (опционально): `RATE_LIMIT_AI_SPEECH_STT`, `RATE_LIMIT_AI_SPEECH_STT_WINDOW_SEC`.

После merge: promote preview → production или дождаться auto-deploy `main`.

## 4. Mobile EAS

Уже: `EXPO_PUBLIC_API_BASE_URL=https://sonogyn-pro.ru` в `eas.json`.

После merge — **новый native build** (expo-audio plugin): preview/prod iOS+Android.

```bash
cd apps/mobile && npx eas-cli build --platform all --profile preview
```

## 5. Дальше (следующие PR)

- Playwright fake `getUserMedia` (opt-in)
- Orads mobile wizard dictation
- `expo-speech` для команды «прочитать» на mobile
- Refactor web FMF import path (не тянуть `apps/mobile` из web)

См. также: [clinical-speech.md](./clinical-speech.md)
