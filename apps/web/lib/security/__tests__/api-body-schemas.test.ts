import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CopilotImageRegisterBodySchema,
  CopilotSeriesCreateBodySchema,
  CopilotStudyCreateBodySchema,
  ForgotPasswordBodySchema,
  InternalNotifyBodySchema,
  MobileExchangeBodySchema,
  MfaVerifyLoginBodySchema,
  NosologyAssistBodySchema,
  OvaryAssistBodySchema,
  PaymentCreateBodySchema,
  ResendConfirmationBodySchema,
  SendCodeBodySchema,
  SignInBodySchema,
  SignUpBodySchema,
  StructuredReportBodySchema,
  TelegramVerifyOtpBodySchema,
  UpdatePasswordBodySchema,
  VerifyCodeBodySchema,
  YooKassaWebhookBodySchema,
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

describe("ForgotPasswordBodySchema", () => {
  it("accepts valid email", () => {
    const r = ForgotPasswordBodySchema.safeParse({ email: "doctor@clinic.ru" });
    assert.equal(r.success, true);
  });
});

describe("UpdatePasswordBodySchema", () => {
  it("rejects short password", () => {
    const r = UpdatePasswordBodySchema.safeParse({ password: "1234567" });
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

describe("CopilotStudyCreateBodySchema", () => {
  it("accepts minimal study create", () => {
    const r = CopilotStudyCreateBodySchema.safeParse({});
    assert.equal(r.success, true);
  });

  it("rejects invalid studyType", () => {
    const r = CopilotStudyCreateBodySchema.safeParse({ studyType: "invalid" });
    assert.equal(r.success, false);
  });
});

describe("CopilotSeriesCreateBodySchema", () => {
  it("accepts label and sortOrder", () => {
    const r = CopilotSeriesCreateBodySchema.safeParse({ label: "Axial", sortOrder: 1 });
    assert.equal(r.success, true);
  });

  it("rejects non-integer sortOrder", () => {
    const r = CopilotSeriesCreateBodySchema.safeParse({ sortOrder: 1.5 });
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

describe("MobileExchangeBodySchema", () => {
  it("accepts exchange code", () => {
    const r = MobileExchangeBodySchema.safeParse({ exchangeCode: "abc-123" });
    assert.equal(r.success, true);
  });

  it("rejects empty code", () => {
    const r = MobileExchangeBodySchema.safeParse({ exchangeCode: "   " });
    assert.equal(r.success, false);
  });
});

describe("YooKassaWebhookBodySchema", () => {
  it("accepts minimal webhook", () => {
    const r = YooKassaWebhookBodySchema.safeParse({
      type: "notification",
      event: "payment.succeeded",
      object: { id: "22e12f66-000f-5000-8000-18db35124563" },
    });
    assert.equal(r.success, true);
  });

  it("rejects missing object id", () => {
    const r = YooKassaWebhookBodySchema.safeParse({
      type: "notification",
      event: "payment.succeeded",
      object: { id: "" },
    });
    assert.equal(r.success, false);
  });
});

describe("SendCodeBodySchema", () => {
  it("accepts sms send", () => {
    const r = SendCodeBodySchema.safeParse({
      method: "sms",
      contact: "+79001234567",
      purpose: "login",
    });
    assert.equal(r.success, true);
  });

  it("rejects invalid method", () => {
    const r = SendCodeBodySchema.safeParse({ method: "fax", contact: "x" });
    assert.equal(r.success, false);
  });
});

describe("VerifyCodeBodySchema", () => {
  it("requires code length", () => {
    const r = VerifyCodeBodySchema.safeParse({
      method: "email",
      contact: "a@b.ru",
      code: "12",
    });
    assert.equal(r.success, false);
  });
});

describe("ResendConfirmationBodySchema", () => {
  it("requires valid email", () => {
    const r = ResendConfirmationBodySchema.safeParse({ email: "bad" });
    assert.equal(r.success, false);
  });
});

describe("MfaVerifyLoginBodySchema", () => {
  it("accepts factor and code", () => {
    const r = MfaVerifyLoginBodySchema.safeParse({ factorId: "f1", code: "123456" });
    assert.equal(r.success, true);
  });
});

describe("InternalNotifyBodySchema", () => {
  it("requires event and message", () => {
    const r = InternalNotifyBodySchema.safeParse({ event: "deploy", message: "ok" });
    assert.equal(r.success, true);
  });
});

describe("NosologyAssistBodySchema", () => {
  it("requires context.title", () => {
    const r = NosologyAssistBodySchema.safeParse({ context: {} });
    assert.equal(r.success, false);
  });

  it("accepts minimal context", () => {
    const r = NosologyAssistBodySchema.safeParse({ context: { title: "Эндометриоз" } });
    assert.equal(r.success, true);
  });
});

describe("OvaryAssistBodySchema", () => {
  it("requires morphology", () => {
    const r = OvaryAssistBodySchema.safeParse({ markers: [] });
    assert.equal(r.success, false);
  });

  it("accepts normal morphology", () => {
    const r = OvaryAssistBodySchema.safeParse({ morphology: "normal" });
    assert.equal(r.success, true);
  });
});

describe("StructuredReportBodySchema", () => {
  it("accepts empty body", () => {
    const r = StructuredReportBodySchema.safeParse({});
    assert.equal(r.success, true);
  });

  it("rejects oversized studyNotes", () => {
    const r = StructuredReportBodySchema.safeParse({ studyNotes: "x".repeat(5000) });
    assert.equal(r.success, false);
  });
});
