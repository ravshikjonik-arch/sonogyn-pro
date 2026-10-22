# Clinical Speech (STT) — SonoGyn Pro

Пакет `@repo/clinical-speech` + web UI `DictationField`.

## Режимы

| Режим | Где | Env |
|-------|-----|-----|
| **device** | Web Speech API (Chrome/Edge) | `NEXT_PUBLIC_SPEECH_STT_MODE=device` |
| **server** | MediaRecorder → Whisper | `OPENROUTER_API_KEY` или `OPENAI_API_KEY` |
| **auto** | device, иначе server | по умолчанию |

API: `GET/POST /api/ai/speech/transcribe` (auth, rate limit, PHI на тексте ответа, аудио не хранится).

## UI

- `apps/web/components/voice/DictationField.tsx` — диктовка, VU, черновик, голосовые команды.
- O-RADS: `OradsAssistPanel` · нозологии: `ClinicalVoiceAssistPanel`.

## Согласие на облако

Если в **auto** нет Web Speech, перед первой серверной диктовкой — чекбокс (sessionStorage). Не диктовать ФИО/телефон/полис.

## Команды (RU)

«точка», «запятая», «новая строка», «очистить», «прочитать», «отменить».

## Тесты

```bash
pnpm --filter @repo/clinical-speech test
pnpm --filter @repo/web test:security   # validate-audio
pnpm --filter @repo/web test:e2e -- tests/e2e/clinical-speech-smoke.spec.ts
```

## Mobile

- `@repo/clinical-speech` — только **postprocess** (без Web Speech в RN).
- `MobileDictationBar` + `expo-audio` → `POST /api/ai/speech/transcribe` (сессия Supabase).
- Первый экран: **FMF Assistant** (`FMFAssistantScreen`).
- Тест: `pnpm --filter @repo/mobile test:speech`

Rollout: [CLINICAL-SPEECH-ROLLOUT.md](./CLINICAL-SPEECH-ROLLOUT.md)

## Дальше

- Playwright с fake `getUserMedia` (opt-in).
- O-RADS mobile wizard, expo-speech для «прочитать».
