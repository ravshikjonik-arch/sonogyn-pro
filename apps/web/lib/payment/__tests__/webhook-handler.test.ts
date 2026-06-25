import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { handlePaymentWebhook } from "@/lib/payment/handlers";

describe("handlePaymentWebhook — security smoke boundaries", () => {
  it("returns 400 for empty body before YooKassa config check", async () => {
    const req = new Request("http://localhost/api/payment/webhook", { method: "POST" });
    const res = await handlePaymentWebhook(req, "");
    assert.equal(res.status, 400);
  });

  it("returns 400 for whitespace-only body", async () => {
    const req = new Request("http://localhost/api/payment/webhook", { method: "POST" });
    const res = await handlePaymentWebhook(req, "   \n");
    assert.equal(res.status, 400);
  });

  it("returns 403 when YooKassa is not configured and body is non-empty", async () => {
    const req = new Request("http://localhost/api/payment/webhook", { method: "POST" });
    const res = await handlePaymentWebhook(req, '{"event":"payment.succeeded"}');
    assert.equal(res.status, 403);
  });
});
