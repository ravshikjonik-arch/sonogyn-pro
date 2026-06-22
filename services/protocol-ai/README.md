# SonoGyn Protocol AI

Rule-first сервис: **русский текст/диктовка → признаки O-RADS + черновик протокола** (CDS, не диагноз).

## Запуск

```bash
cd services/protocol-ai
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

export PROTOCOL_AI_SECRET=dev-local-secret   # опционально
uvicorn main:app --host 0.0.0.0 --port 8091 --reload
```

## Web (.env.local)

```
PROTOCOL_AI_URL=http://127.0.0.1:8091
PROTOCOL_AI_SECRET=dev-local-secret
```

## API

`POST /orads/from-text`

```json
{
  "text": "Справа в яичнике унилокулярная киста 42 мм, без солидного компонента, пременопауза",
  "age_years": 35,
  "menopause": "pre"
}
```

Ответ: `extracted`, `features[]`, `protocol_draft`, `orads_hint`, `missing_fields`, `disclaimer`.

## React

```tsx
import { useOradsFromText } from "@/hooks/useOradsFromText";

const { analyze, result, loading, error } = useOradsFromText();
await analyze({ text: transcript, ageYears: 35, menopause: "pre" });
```

Финальная категория O-RADS — через `@repo/orads-us` (`calculateOradsResult`) после подтверждения врачом.
