import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { encodeReplyQuote, parseReplyQuote } from "./reply-quote";

describe("reply quotes", () => {
  it("round-trips an excerpt and the message", () => {
    const encoded = encodeReplyQuote("Киста 4 см", "Это O-RADS 2");
    const parsed = parseReplyQuote(encoded);
    assert.equal(parsed.excerpt, "Киста 4 см");
    assert.equal(parsed.text, "Это O-RADS 2");
  });

  it("leaves a normal message untouched", () => {
    const parsed = parseReplyQuote("Просто текст");
    assert.equal(parsed.excerpt, null);
    assert.equal(parsed.text, "Просто текст");
  });
});
