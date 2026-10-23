import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { extractCaseIdsFromMessageBody } from "./parse-clinical-links";
import { parseMessengerAiMention } from "./parse-ai-mention";

const CASE_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

describe("extractCaseIdsFromMessageBody", () => {
  it("finds relative and absolute case links", () => {
    const ids = extractCaseIdsFromMessageBody(
      `Смотрите кейс /cases/${CASE_ID} и https://sonogyn-pro.ru/cases/${CASE_ID}`,
    );
    assert.equal(ids.length, 1);
    assert.equal(ids[0], CASE_ID);
  });
});

describe("parseMessengerAiMention", () => {
  it("extracts prompt after @AI", () => {
    const p = parseMessengerAiMention("@AI O-RADS 4 — тактика?");
    assert.ok(p);
    assert.match(p!.prompt, /O-RADS/);
  });
});
