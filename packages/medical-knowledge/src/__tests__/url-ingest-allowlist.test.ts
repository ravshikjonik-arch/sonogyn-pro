import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { checkUrlIngestAllowlist } from "../url-ingest-allowlist.js";

describe("checkUrlIngestAllowlist", () => {
  it("allows known https guideline hosts", () => {
    const r = checkUrlIngestAllowlist(
      "https://www.endocrincentr.ru/sites/default/files/specialists/science/clinic-recomendations/zob.pdf",
    );
    assert.equal(r.ok, true);
    if (r.ok) assert.match(r.policy.note, /РАЭ/);
  });

  it("marks WHO as non-commercial", () => {
    const r = checkUrlIngestAllowlist("https://iris.who.int/bitstream/handle/10665/255150/x.pdf");
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.policy.nonCommercial, true);
  });

  it("rejects http, localhost, and unknown hosts", () => {
    assert.equal(checkUrlIngestAllowlist("http://endocrincentr.ru/a.pdf").ok, false);
    assert.equal(checkUrlIngestAllowlist("https://localhost/a.pdf").ok, false);
    assert.equal(checkUrlIngestAllowlist("https://evil.example/a.pdf").ok, false);
  });
});
