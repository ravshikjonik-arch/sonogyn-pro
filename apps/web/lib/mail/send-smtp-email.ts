import nodemailer from "nodemailer";

import { getSmtpConfig } from "./smtp-config";

export type SmtpSendParams = {
  to: string;
  subject: string;
  text: string;
};

export type SmtpSendResult =
  | { ok: true; messageId?: string }
  | { ok: false; errorCode: string; message: string; bounce?: boolean };

function mapSmtpError(err: unknown): SmtpSendResult {
  const message =
    err instanceof Error ? err.message : typeof err === "string" ? err : "smtp_send_failed";
  const lower = message.toLowerCase();

  if (lower.includes("activate your mailgun account")) {
    return {
      ok: false,
      errorCode: "smtp_account_not_activated",
      message:
        "Mailgun: аккаунт не активирован. Проверьте почту регистрации или панель Mailgun → Resend activation.",
    };
  }

  if (lower.includes("authorized recipients")) {
    return {
      ok: false,
      errorCode: "smtp_sandbox_recipient",
      message:
        "Mailgun Sandbox: добавьте получателя в Sending → Authorized Recipients или подключите свой домен.",
      bounce: true,
    };
  }

  if (lower.includes("not allowed to send")) {
    return {
      ok: false,
      errorCode: "smtp_send_not_allowed",
      message: message,
    };
  }

  if (lower.includes("authentication") || lower.includes("535")) {
    return {
      ok: false,
      errorCode: "smtp_auth_failed",
      message: "SMTP: неверный логин или пароль (SMTP_USER / SMTP_PASSWORD).",
    };
  }

  return { ok: false, errorCode: "smtp_provider_error", message };
}

/** Отправка plain-text письма через SMTP (Mailgun и др.). */
export async function sendSmtpEmail(params: SmtpSendParams): Promise<SmtpSendResult> {
  const config = getSmtpConfig();
  if (!config) {
    return {
      ok: false,
      errorCode: "email_not_configured",
      message: "SMTP не настроен: задайте SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD.",
    };
  }

  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.password,
    },
    requireTLS: config.port === 587,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
  });

  try {
    const info = await transport.sendMail({
      from: config.from,
      to: params.to,
      subject: params.subject,
      text: params.text,
    });
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    return mapSmtpError(err);
  } finally {
    transport.close();
  }
}
