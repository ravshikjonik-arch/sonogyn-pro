import { NextResponse } from "next/server";

import { shouldAutoConfirmEmail } from "@/lib/auth/auto-confirm-email";
import { resolveEmailConfirmRedirect } from "@/lib/auth/email-confirmation";
import { resolveAppOrigin } from "@/lib/auth/app-origin";
import { isTurnstileConfigured } from "@/lib/auth/verify-turnstile";

export const runtime = "nodejs";

/** Публичная диагностика auth (без секретов). */
export async function GET(req: Request) {
  const appOrigin = resolveAppOrigin(req);
  const emailRedirectTo = resolveEmailConfirmRedirect(req, "/app");

  const issues: string[] = [];

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    issues.push("NEXT_PUBLIC_SUPABASE_URL не задан");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
    issues.push("NEXT_PUBLIC_SUPABASE_ANON_KEY не задан");
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    issues.push("SUPABASE_SERVICE_ROLE_KEY не задан — Telegram и auto-confirm email не работают");
  }
  if (!process.env.TELEGRAM_BOT_TOKEN?.trim()) {
    issues.push("TELEGRAM_BOT_TOKEN не задан на сервере — вход через Telegram недоступен");
  }
  if (!process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim()) {
    issues.push("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME не задан");
  }
  if (appOrigin.includes("localhost")) {
    issues.push("APP origin указывает на localhost — ссылки в письмах будут неверными");
  }

  return NextResponse.json({
    ok: issues.length === 0,
    appOrigin,
    emailRedirectTo,
    telegramBotUsername:
      process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim() ||
      process.env.TELEGRAM_BOT_USERNAME?.trim() ||
      "",
    features: {
      emailAutoConfirm: shouldAutoConfirmEmail(),
      telegramReady: Boolean(
        process.env.TELEGRAM_BOT_TOKEN?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
      ),
      turnstileConfigured: isTurnstileConfigured(),
    },
    issues,
    hints: {
      supabaseSiteUrl: appOrigin,
      supabaseRedirectUrls: [`${appOrigin}/auth/callback`, `${appOrigin}/**`],
      telegram: [
        "BotFather → /mybots → ваш бот → API Token → TELEGRAM_BOT_TOKEN в Vercel (Production + Preview)",
            "BotFather → /setdomain → домен: sonogyn-pro-web.vercel.app",
        "Имя бота (@username) должно совпадать с NEXT_PUBLIC_TELEGRAM_BOT_USERNAME",
        "После добавления токена — Redeploy на Vercel",
      ],
      phoneSms: [
        "Supabase Dashboard → Authentication → Providers → Phone → Enable",
        "Enable phone confirmations + Allow phone sign-ups",
        "SMS provider: Twilio (Account SID, Auth Token, Message Service SID или номер)",
        "Тест Twilio Trial: только на Verified Caller IDs; для РФ (+7) — отдельное одобрение Twilio",
        "Формат номера в приложении: +79001234567",
      ],
      emailDeliverability:
        "mail.ru / gmail: проверьте «Спам». Для надёжной доставки — Supabase → Auth → SMTP.",
    },
  });
}
