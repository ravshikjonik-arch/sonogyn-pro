# Evidence eval (Ragas) — Wave 1 scaffold

**Status:** soft / offline. Does **not** run in default CI and does not call paid APIs unless you opt in.

## Purpose

Measure RAG faithfulness / context relevance for SonoGyn Evidence answers once you have fixtures with:
- `question`
- `contexts[]` (citation snippets)
- `answer` (assistant summary)

## Setup (local)

```bash
cd services/evidence-eval
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run (opt-in)

```bash
# Uses fixtures/sample_ragas.json only — set OPENAI_API_KEY or LITELLM if you enable judge LLM.
python run_ragas_sample.py
```

Without API keys the script validates fixture schema and exits 0 (structural soft gate).

## Relation to Promptfoo

| Tool | Role |
|------|------|
| Promptfoo / `eval/run-golden-structural.mjs` | Injection + grounding policy, CI soft |
| Ragas (this folder) | Faithfulness metrics when retrieval+answer pairs exist |

Do not install both as blocking CI yet.
