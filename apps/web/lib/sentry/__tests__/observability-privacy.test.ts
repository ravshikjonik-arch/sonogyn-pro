import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { scrubSentryEvent, scrubStringValue } from "../scrub-event";
import {
  isClinicalRoutePath,
  isReplayBlockedPath,
  resolveSentryEnvironment,
  resolveTracesSampleRate,
} from "../flags";

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

  it("redacts AI chat messages and protocol content", () => {
    const out = scrubSentryEvent(
      {
        type: "error",
        extra: {
          messages: [{ role: "user", content: "O-RADS 4 киста 40mm" }],
          protocol: "Заключение: ...",
        },
      } as unknown as Parameters<typeof scrubSentryEvent>[0],
      {},
    );
    const extra = out?.extra as Record<string, unknown>;
    assert.equal(extra.messages, "[redacted]");
    assert.equal(extra.protocol, "[redacted]");
  });

  it("scrubs JWT and signed URLs in string fields", () => {
    const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature";
    const signed =
      "https://xxx.supabase.co/storage/v1/object/sign/cases/scan.dcm?token=abc";
    const out = scrubSentryEvent(
      {
        type: "error",
        message: `Auth failed ${jwt} url=${signed}`,
      } as unknown as Parameters<typeof scrubSentryEvent>[0],
      {},
    );
    assert.match(out?.message ?? "", /\[redacted\]/);
    assert.doesNotMatch(out?.message ?? "", /eyJhbGci/);
  });

  it("redacts DICOM metadata keys", () => {
    const out = scrubSentryEvent(
      {
        type: "error",
        extra: {
          dicom: { instance_uid: "1.2.3", sop_class: "US" },
          filename: "patient_scan.dcm",
        },
      } as unknown as Parameters<typeof scrubSentryEvent>[0],
      {},
    );
    const extra = out?.extra as Record<string, unknown>;
    assert.equal(extra.dicom, "[redacted]");
    assert.equal(extra.filename, "[redacted]");
  });

  it("strips all query params on clinical routes", () => {
    const out = scrubSentryEvent(
      {
        type: "error",
        request: { url: "/workspace/study-1?tab=protocol&foo=bar" },
      } as unknown as Parameters<typeof scrubSentryEvent>[0],
      {},
    );
    assert.equal(out?.request?.url, "/workspace/study-1");
  });

  it("drops breadcrumbs on clinical API paths", () => {
    const out = scrubSentryEvent(
      {
        type: "error",
        breadcrumbs: [
          { message: "fetch", data: { url: "/api/ai/chat" } },
          { message: "nav", data: { url: "/landing" } },
        ],
      } as unknown as Parameters<typeof scrubSentryEvent>[0],
      {},
    );
    assert.equal(out?.breadcrumbs?.length, 1);
    assert.equal(out?.breadcrumbs?.[0]?.data?.url, "/landing");
  });
});

describe("scrubStringValue", () => {
  it("redacts base64 image blobs", () => {
    const blob = `data:image/png;base64,${"A".repeat(120)}`;
    const out = scrubStringValue(blob);
    assert.equal(out, "[redacted]");
  });
});

describe("sentry route policy", () => {
  it("marks clinical routes", () => {
    assert.equal(isClinicalRoutePath("/cases/abc"), true);
    assert.equal(isClinicalRoutePath("/tools/imaging/dicom-viewer"), true);
    assert.equal(isClinicalRoutePath("/profile/patients"), true);
    assert.equal(isClinicalRoutePath("/landing"), false);
  });

  it("blocks replay on sensitive pages", () => {
    assert.equal(isReplayBlockedPath("/workspace/abc"), true);
    assert.equal(isReplayBlockedPath("/tools/imaging/dicom-viewer"), true);
    assert.equal(isReplayBlockedPath("/login"), false);
  });
});

describe("sentry sampling by environment", () => {
  it("uses zero traces in development", () => {
    const prev = process.env.VERCEL_ENV;
    process.env.VERCEL_ENV = "development";
    assert.equal(resolveTracesSampleRate(), 0);
    process.env.VERCEL_ENV = prev;
  });

  it("resolves environment label", () => {
    const prev = process.env.VERCEL_ENV;
    process.env.VERCEL_ENV = "preview";
    assert.equal(resolveSentryEnvironment(), "preview");
    process.env.VERCEL_ENV = prev;
  });
});
