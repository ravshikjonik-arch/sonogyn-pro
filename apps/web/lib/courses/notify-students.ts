import { TelegramService } from "@/services/telegram";
import { sendSmsRuText } from "@/lib/auth/sms-providers/smsru-text";
import { createCourseAdminClient } from "@/lib/courses/admin-client";

export type NotifyChannelResult = {
  email: { sent: number; failed: number; skipped: number };
  sms: { sent: number; failed: number; skipped: number };
  telegram: { sent: number; failed: number; skipped: number };
};

async function sendCourseEmail(to: string, subject: string, text: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim() || "SonoGyn Pro <noreply@sonogyn.app>";

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[course-notify] email_mock", { to, subject });
      return true;
    }
    return false;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  return res.ok;
}

export async function notifyCourseStudents(params: {
  courseId: string;
  subject: string;
  message: string;
  channels: { email?: boolean; sms?: boolean; telegram?: boolean };
}): Promise<NotifyChannelResult> {
  const result: NotifyChannelResult = {
    email: { sent: 0, failed: 0, skipped: 0 },
    sms: { sent: 0, failed: 0, skipped: 0 },
    telegram: { sent: 0, failed: 0, skipped: 0 },
  };

  const admin = createCourseAdminClient();
  if (!admin) return result;

  const { data: enrollments } = await admin
    .from("course_enrollments")
    .select("user_id")
    .eq("course_id", params.courseId);

  const userIds = (enrollments ?? []).map((e) => e.user_id as string);
  if (userIds.length === 0) return result;

  for (const userId of userIds) {
    const { data: userData } = await admin.auth.admin.getUserById(userId);
    const email = userData.user?.email ?? null;
    const meta = userData.user?.user_metadata ?? {};
    const phone = typeof meta.phone === "string" ? meta.phone : userData.user?.phone ?? null;
    const telegramId = meta.telegram_id ? String(meta.telegram_id) : null;

    if (params.channels.email) {
      if (email && !email.endsWith("@telegram.sonogyn.app")) {
        const ok = await sendCourseEmail(email, params.subject, params.message);
        if (ok) result.email.sent += 1;
        else result.email.failed += 1;
      } else {
        result.email.skipped += 1;
      }
    }

    if (params.channels.sms) {
      if (phone) {
        const sms = await sendSmsRuText({ toE164: phone, text: `${params.subject}\n${params.message}` });
        if (sms.ok) result.sms.sent += 1;
        else result.sms.failed += 1;
      } else {
        result.sms.skipped += 1;
      }
    }

    if (params.channels.telegram) {
      if (telegramId) {
        const ok = await TelegramService.sendMessage(telegramId, `${params.subject}\n\n${params.message}`);
        if (ok) result.telegram.sent += 1;
        else result.telegram.failed += 1;
      } else {
        result.telegram.skipped += 1;
      }
    }
  }

  return result;
}
