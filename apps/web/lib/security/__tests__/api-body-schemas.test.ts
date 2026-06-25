import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CopilotImageRegisterBodySchema,
  PaymentCreateBodySchema,
  SignInBodySchema,
  SignUpBodySchema,
  TelegramVerifyOtpBodySchema,
} from "../api-body-schemas";
import { validateRegisteredStorageSignature } from "../file-validation";

describe("SignInBodySchema", () => {
  it("accepts valid credentials", () => {
    const r = SignInBodySchema.safeParse({
      email: "doctor@clinic.ru",
      password: "secret123",
    });
    assert.equal(r.success, true);
  });

  it("rejects invalid email", () => {
    const r = SignInBodySchema.safeParse({ email: "bad", password: "x" });
    assert.equal(r.success, false);
  });
});

describe("CopilotImageRegisterBodySchema", () => {
  it("rejects path traversal in fileName", () => {
    const r = CopilotImageRegisterBodySchema.safeParse({
      studyId: "11111111-1111-4111-8111-111111111111",
      seriesId: "22222222-2222-4222-8222-222222222222",
      storagePath: "u/s/p/x.png",
      fileName: "../etc/passwd",
    });
    assert.equal(r.success, false);
  });
});

describe("validateRegisteredStorageSignature", () => {
  it("accepts PNG magic bytes", () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const r = validateRegisteredStorageSignature("image/png", png, png.length);
    assert.equal(r.ok, true);
  });

  it("rejects unknown signature", () => {
    const junk = new Uint8Array([0x00, 0x01, 0x02]);
    const r = validateRegisteredStorageSignature("image/png", junk, junk.length);
    assert.equal(r.ok, false);
  });
});

describe("SignUpBodySchema", () => {
  it("requires full_name and specialization", () => {
    const r = SignUpBodySchema.safeParse({
      email: "a@b.ru",
      password: "p",
      full_name: "Иван",
      specialization: "obgyn",
    });
    assert.equal(r.success, true);
  });
});

describe("TelegramVerifyOtpBodySchema", () => {
  it("requires chat id and code", () => {
    const r = TelegramVerifyOtpBodySchema.safeParse({ chatId: "123", code: "456789" });
    assert.equal(r.success, true);
  });

  it("rejects missing code", () => {
    const r = TelegramVerifyOtpBodySchema.safeParse({ chatId: "123" });
    assert.equal(r.success, false);
  });
});

describe("PaymentCreateBodySchema", () => {
  it("rejects invalid returnUrl", () => {
    const r = PaymentCreateBodySchema.safeParse({ returnUrl: "not-a-url" });
    assert.equal(r.success, false);
  });
});
