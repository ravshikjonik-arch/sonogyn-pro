import { z } from "zod";

import { normalizePhone } from "@/lib/auth/oauth-providers";

const emailSchema = z.string().email().max(254);

/** Защита от подмены номера: только E.164 после normalizePhone. */
export function parseSmsContact(raw: string): string | null {
  const phone = normalizePhone(raw);
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) return null;
  return phone;
}

export function parseEmailContact(raw: string): string | null {
  const parsed = emailSchema.safeParse(raw.trim().toLowerCase());
  return parsed.success ? parsed.data : null;
}

export function parseTelegramChatId(raw: string): string | null {
  const id = raw.trim();
  if (!/^\d{5,20}$/.test(id)) return null;
  return id;
}

/** Санитизация текста для Telegram/HTML email — базовая защита от XSS в шаблонах. */
export function escapeVerificationTemplateText(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
