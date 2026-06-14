import { escapeVerificationTemplateText } from "../validate-contact";
import { withTimeout } from "../with-timeout";

export type EmailSendResult = { ok: true } | { ok: false; errorCode: string; bounce?: boolean };

const EMAIL_TIMEOUT_MS = 12_000;

async function sendVerificationEmailInner(params: {
  to: string;
  code: string;
  purposeLabel: string;
}): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim() || "SonoGyn Pro <noreply@sonogyn.app>";

  const subject = escapeVerificationTemplateText(`Код подтверждения — ${params.purposeLabel}`);
  const text = [
    "Код подтверждения SonoGyn Pro",
    "",
    `Код: ${params.code}`,
    "",
    "Действует 5 минут. Никому не сообщайте код.",
    "",
    "Если вы не запрашивали код — проигнорируйте письмо.",
  ].join("\n");

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, errorCode: "email_not_configured" };
    }
    console.info("[auth:verification] email_mock_sent", { purpose: params.purposeLabel });
    return { ok: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject,
      text,
    }),
  });

  if (res.ok) return { ok: true };

  const body = (await res.json().catch(() => null)) as { name?: string } | null;
  const bounce = res.status === 422 || body?.name === "validation_error";
  return { ok: false, errorCode: bounce ? "email_bounce" : "email_provider_error", bounce };
}

/** Email через Resend, таймаут 12 с (Vercel serverless limit). */
export async function sendVerificationEmail(params: {
  to: string;
  code: string;
  purposeLabel: string;
}): Promise<EmailSendResult> {
  return withTimeout(sendVerificationEmailInner(params), EMAIL_TIMEOUT_MS, "email");
}
