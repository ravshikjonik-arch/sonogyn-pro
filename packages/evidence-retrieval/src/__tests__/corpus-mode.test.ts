import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  emptyCorpusMessage,
  isRfCorpusMode,
  providersForCorpusMode,
  shelvesForCorpusMode,
} from "../corpus-mode.js";
import { formatEvidenceAnswerForClipboard } from "../format-share.js";
import { pickGuidelineCitation } from "../guideline-citation.js";
import type { AssistantAnswer } from "../types.js";

describe("corpus mode", () => {
  it("maps RF modes to kr_mz_rf provider only", () => {
    assert.deepEqual(providersForCorpusMode("rf_kr"), ["kr_mz_rf"]);
    assert.deepEqual(providersForCorpusMode("rf_npa"), ["kr_mz_rf"]);
    assert.equal(providersForCorpusMode("all"), undefined);
    assert.equal(isRfCorpusMode("rf_all"), true);
  });

  it("maps shelves for RF modes", () => {
    assert.deepEqual(shelvesForCorpusMode("rf_kr"), ["kr_mz_rf"]);
    assert.deepEqual(shelvesForCorpusMode("rf_npa"), ["orders_dzm", "orders_mz_rf"]);
  });

  it("picks section + quote from guideline", () => {
    const cite = pickGuidelineCitation(
      {
        id: "demo",
        title: "УЗИ в гинекологии",
        summary: "O-RADS и IOTA",
        shelf: "kr_mz_rf",
        documentKind: "clinical_recommendation",
        issuer: "mz_rf",
        specialty: "ultrasound",
        year: 2024,
        status: "active",
        sections: [
          {
            title: "O-RADS / IOTA — тактика",
            bullets: ["O-RADS 3: низкий риск — наблюдение по локальному протоколу."],
          },
        ],
      },
      "O-RADS 3 наблюдение",
    );
    assert.equal(cite.section, "O-RADS / IOTA — тактика");
    assert.match(cite.quote ?? "", /O-RADS 3/);
  });

  it("formats clipboard card and empty message", () => {
    assert.match(emptyCorpusMessage("q", "rf_kr"), /КР МЗ РФ/);
    const answer: AssistantAnswer = {
      query: "тест",
      summary: "Кратко",
      evidenceStrength: "moderate",
      gradeLabel: "умеренно",
      recommendations: ["Сверьте с КР"],
      contraindications: [],
      alternatives: [],
      citations: [
        {
          id: "kr_mz_rf:x",
          provider: "kr_mz_rf",
          sourceId: "x",
          recordType: "guideline",
          title: "Документ",
          url: "https://example.com",
          retrievedAt: new Date().toISOString(),
          relevanceScore: 1,
          section: "Раздел А",
          quote: "Цитата",
        },
      ],
      guidelines: [],
      disclaimers: [],
      sourcesUsed: {},
      searchedAt: new Date().toISOString(),
      synthesisMode: "rules",
      corpusMode: "rf_kr",
    };
    const text = formatEvidenceAnswerForClipboard(answer);
    assert.match(text, /Раздел: Раздел А/);
    assert.match(text, /CDS/);
  });
});
