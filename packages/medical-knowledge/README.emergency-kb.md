# Emergency KB — база знаний движка помощника

Врач пишет «инсульт» / «инфаркт» → `retrieve` → карточка **флаги / 1-2-3 / не делать / эскалация**  
только из **своей** KB (не live-интернет).

## Что лежит в проекте

| Слой | Где | В git? |
|------|-----|--------|
| Полный текст 482 стр. + PDF | `data/emergency-corpus/` | **нет** (© Эксмо) |
| 216 тем оглавления + 160 страниц как статьи | `data/emergency-corpus/articles.json`, `page-articles.json` | **нет** |
| Оглавление (только названия + стр.) | `src/fixtures/emergency-toc-index.json` | да |
| 8 curated-карточек (короткие 1-2-3) | `src/fixtures/emergency-action-cards.ts` | да |
| Загрузчик корпуса | `src/fixtures/load-emergency-corpus.ts` | да |
| Скрипт пересборки | `scripts/extract-emergency-corpus.py` | да |

## Пересборка корпуса

```bash
python3 packages/medical-knowledge/scripts/extract-emergency-corpus.py \
  --pdf ~/Downloads/Полный_медицинский_справочник_фельдшера_2025.pdf \
  --extra-pdf ~/Downloads/Скорая\ медицинская\ помощь.pdf \
  --extra-pdf ~/Downloads/Оказание_неотложной_помощи_в_терапии.pdf
```

Сканы без текстового слоя попадут в `pdfs/`, затем OCR:

```bash
python3 packages/medical-knowledge/scripts/ocr-emergency-scans.py --workers 4
# smoke: --limit 5 --book skoraya
```

Результат: `data/emergency-corpus/ocr/{skoraya,neotlozhnaya}/` (pages + page-articles.json).

## API движка

```ts
import {
  createFixtureKnowledgeRepository,
  retrieveMedicalKnowledge,
  formatRetrieveResultForAssistant,
  getEmergencyCorpusStats,
} from "@repo/medical-knowledge";

const repo = createFixtureKnowledgeRepository();
const result = await retrieveMedicalKnowledge(
  { query: "инфаркт", specialty: "emergency", limit: 5 },
  repo,
);
const draft = formatRetrieveResultForAssistant(result);
```

UI: `/tools/refs/medical-knowledge` → режим «Неотложка».

## Важно

- Полный текст книги — **локально для движка** (Colibri / dev). В публичный Vercel не уезжает.
- Ответы помощнику — справочно; решение принимает врач; не диагноз.
- Два PDF-скана: `ocr-emergency-scans.py` (локально; не в git/Vercel).
