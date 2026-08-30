import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { scrubSentryEvent } from "../scrub-event";

describe("scrubSentryEvent", () => {
  it("redacts PHI keys in extra context", () => {
    const out = scrubSentryEvent(
      {
        type: "error",
        extra: { patient: "Jane Doe", module: "orads" },
      } as unknown as Parameters<typeof scrubSentryEvent>[0],
      {},
    );
    assert.equal((out?.extra as Record<string, unknown>).patient, "[redacted]");
    assert.equal((out?.extra as Record<string, unknown>).module, "orads");
  });

  it("strips request body and cookies", () => {
    const out = scrubSentryEvent(
      {
        type: "error",
        request: {
          url: "/api/cases/abc?email=test@x.ru",
          data: { conclusion: "secret" },
          cookies: { sb: "token" },
          headers: { authorization: "Bearer x" },
        },
      } as unknown as Parameters<typeof scrubSentryEvent>[0],
      {},
    );
    assert.equal(out?.request?.data, undefined);
    assert.equal(out?.request?.cookies, undefined);
    assert.equal(out?.request?.headers?.authorization, "[redacted]");
  });

  it("truncates long string values", () => {
    const out = scrubSentryEvent(
      {
        type: "error",
        extra: { module: "hello ".repeat(200) },
      } as unknown as Parameters<typeof scrubSentryEvent>[0],
      {},
    );
    const note = (out?.extra as Record<string, unknown>).module as string;
    assert.match(note, /truncated/);
  });
});
