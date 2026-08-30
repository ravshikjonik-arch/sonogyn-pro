import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { UltrasoundProtocolPayload } from "@repo/types";

import {
  appendClinicalConclusion,
  resolveProtocolConclusionHtml,
  resolveProtocolConclusionPlain,
  syncProtocolConclusionFields,
} from "../conclusion-for-export";

function proto(partial: Partial<UltrasoundProtocolPayload>): UltrasoundProtocolPayload {
  return {
    study_date: "2026-01-01",
    biometry: {},
    doppler: {},
    amniotic: {},
    organs: {},
    ...partial,
  };
}

describe("resolveProtocolConclusionPlain", () => {
  it("prefers plain text derived from conclusion_html", () => {
    const plain = resolveProtocolConclusionPlain(
      proto({
        conclusion: "legacy",
        conclusion_html: "<p><strong>Rich</strong> text</p>",
      }),
    );
    assert.match(plain, /Rich/);
  });

  it("falls back to plain conclusion", () => {
    const plain = resolveProtocolConclusionPlain(proto({ conclusion: "Plain only" }));
    assert.equal(plain, "Plain only");
  });
});

describe("resolveProtocolConclusionHtml", () => {
  it("sanitizes stored html", () => {
    const html = resolveProtocolConclusionHtml(
      proto({ conclusion_html: "<p>Ok</p><script>x</script>" }),
    );
    assert.equal(html, "<p>Ok</p>");
  });
});

describe("appendClinicalConclusion", () => {
  it("appends to both plain and html fields", () => {
    const next = appendClinicalConclusion(
      { conclusion: "A", conclusion_html: "<p>A</p>" },
      "B line",
    );
    assert.match(next.conclusion ?? "", /A/);
    assert.match(next.conclusion ?? "", /B line/);
    assert.match(next.conclusion_html ?? "", /B line/);
  });
});

describe("syncProtocolConclusionFields", () => {
  it("derives plain conclusion from html on save", () => {
    const synced = syncProtocolConclusionFields(proto({ conclusion_html: "<p>Synced</p>" }));
    assert.equal(synced.conclusion, "Synced");
    assert.equal(synced.conclusion_html, "<p>Synced</p>");
  });
});
