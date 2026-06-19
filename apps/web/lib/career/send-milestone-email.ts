import type { CareerProgress } from "@/lib/career/ladder";

export type MilestoneEmailResult = { ok: true } | { ok: false; errorCode: string };

async function sendResendEmail(params: {
  to: string;
  subject: string;
  text: string;
}): Promise<MilestoneEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim() || "SonoGyn Pro <noreply@sonogyn.app>";

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[career/milestone] email_mock", { to: params.to, subject: params.subject });
      return { ok: true };
    }
    return { ok: false, errorCode: "email_not_configured" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: params.subject,
      text: params.text,
    }),
  });

  return res.ok ? { ok: true } : { ok: false, errorCode: "email_send_failed" };
}

/** Письмо «75% пути — вы врач на платформе, остался PRO». */
export async function sendDoctorMilestoneEmail(params: {
  to: string;
  fullName?: string | null;
  progress: CareerProgress;
  appOrigin: string;
}): Promise<MilestoneEmailResult> {
  const name = params.fullName?.trim() || "коллега";
  const paywallUrl = `${params.appOrigin}/paywall`;
  const appUrl = `${params.appOrigin}/app`;

  const text = [
    `Здравствуйте, ${name}!`,
    "",
    `Вы прошли 75% пути на SonoGyn Pro — статус «${params.progress.currentStage === "doctor" ? "Врач" : "Врач"}».`,
    "Профиль заполнен, курс подключён — полный клинический кабинет уже ваш.",
    "",
    "Следующий шаг — PRO (100%): без лимитов AI-разборов и расширенные квоты кейсов.",
    "",
    `→ Оформить PRO: ${paywallUrl}`,
    `→ Открыть кабинет: ${appUrl}`,
    "",
    "Инструмент ассистивный. Заключение и решение — за лечащим врачом.",
    "",
    "— SonoGyn Pro",
  ].join("\n");

  return sendResendEmail({
    to: params.to,
    subject: "75% пути пройдено — остался шаг PRO · SonoGyn Pro",
    text,
  });
}

/** Письмо при переходе на ординатора (запись на курс). */
export async function sendInternMilestoneEmail(params: {
  to: string;
  fullName?: string | null;
  courseTitle?: string;
  appOrigin: string;
}): Promise<MilestoneEmailResult> {
  const name = params.fullName?.trim() || "коллега";
  const profileUrl = `${params.appOrigin}/profile`;

  const text = [
    `Здравствуйте, ${name}!`,
    "",
    params.courseTitle
      ? `Вы записаны на курс «${params.courseTitle}» — статус «Ординатор» на платформе.`
      : "Вы записаны на курс — статус «Ординатор» на платформе.",
    "",
    "Завершите профиль врача (ФИО, дата рождения, специализация) — откроется полный кабинет и статус «Врач».",
    "",
    `→ Заполнить профиль: ${profileUrl}`,
    "",
    "— SonoGyn Pro",
  ].join("\n");

  return sendResendEmail({
    to: params.to,
    subject: "Вы ординатор на SonoGyn Pro — завершите профиль",
    text,
  });
}
