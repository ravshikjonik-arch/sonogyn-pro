import { escapeVerificationTemplateText } from "../validate-contact";
import { withTimeout } from "../with-timeout";
import { isSmtpConfigured } from "@/lib/mail/smtp-config";
import { sendSmtpEmail } from "@/lib/mail/send-smtp-email";

export type EmailSendResult = { ok: true } | { ok: false; errorCode: string; bounce?: boolean };

const EMAIL_TIMEOUT_MS = 12_000;

async function sendVerificationEmailInner(params: {
  to: string;
  code: string;
  purposeLabel: string;
}): Promise<EmailSendResult> {
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

  if (!isSmtpConfigured()) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, errorCode: "email_not_configured" };
    }
    console.info("[auth:verification] email_mock_sent", { purpose: params.purposeLabel });
    return { ok: true };
  }

  const result = await sendSmtpEmail({
    to: params.to,
    subject,
    text,
  });

  if (result.ok) return { ok: true };

  return {
    ok: false,
    errorCode: result.errorCode,
    bounce: result.bounce,
  };
}

/** Email через SMTP (Mailgun), таймаут 12 с (Vercel serverless limit). */
export async function sendVerificationEmail(params: {
  to: string;
  code: string;
  purposeLabel: string;
}): Promise<EmailSendResult> {
  return withTimeout(sendVerificationEmailInner(params), EMAIL_TIMEOUT_MS, "email");
}
