import { NextResponse } from "next/server";

import { shouldAutoConfirmEmail } from "@/lib/auth/auto-confirm-email";
import {
  getAuthSessionMaxAgeDays,
  isDevAuthModeEnabled,
} from "@/lib/auth/dev-auth-mode";
import { resolveEmailConfirmRedirect } from "@/lib/auth/email-confirmation";
import { resolveAppOrigin } from "@/lib/auth/app-origin";
import { SUPABASE_DEV_AUTH_CHECKLIST } from "@/lib/auth/supabase-dashboard-checklist";
import { isTurnstileConfigured } from "@/lib/auth/verify-turnstile";
import { isCustomSmsAuthEnabled, resolveSmsProvider } from "@/lib/auth/sms-providers";

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
    devAuth: {
      enabled: isDevAuthModeEnabled(),
      sessionMaxAgeDays: getAuthSessionMaxAgeDays() ?? null,
      autoLogin: process.env.DEV_AUTO_LOGIN === "true" && process.env.NODE_ENV === "development",
    },
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
      smsProvider: resolveSmsProvider(),
      customSmsAuth: isCustomSmsAuthEnabled(),
    },
    issues,
    hints: {
      supabaseSiteUrl: appOrigin,
      supabaseRedirectUrls: [`${appOrigin}/auth/callback`, `${appOrigin}/**`],
      supabaseDashboard: SUPABASE_DEV_AUTH_CHECKLIST,
      devAuthEnv: [
        "DEV_AUTH_MODE=true          # только local npm run dev",
        "AUTH_SESSION_MAX_AGE_DAYS=90",
        "AUTH_AUTO_CONFIRM_EMAIL=true",
        "SUPABASE_SERVICE_ROLE_KEY=… # из Dashboard → API",
        "DEV_AUTO_LOGIN=true         # опционально: вход без формы при открытии /",
      ],
      telegram: [
        "BotFather → /mybots → ваш бот → API Token → TELEGRAM_BOT_TOKEN в Vercel (Production + Preview)",
            "BotFather → /setdomain → домен: sonogyn-pro-web.vercel.app",
        "Имя бота (@username) должно совпадать с NEXT_PUBLIC_TELEGRAM_BOT_USERNAME",
        "После добавления токена — Redeploy на Vercel",
      ],
      googleOAuth: [
        "Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client",
        "Authorized redirect URI: https://YOUR_PROJECT.supabase.co/auth/v1/callback",
        "Supabase → Authentication → Providers → Google → включить, вставить Client ID и Secret",
        "Supabase → URL Configuration: Site URL = NEXT_PUBLIC_APP_URL, Redirect URLs = …/auth/callback",
      ],
      phoneSms: [
        "РФ: SMS.ru — SMSRU_API_ID в Vercel + SMS_PROVIDER=smsru (без Twilio)",
        "Supabase Phone + Twilio — только если Twilio доступен в вашем регионе",
        "Формат номера: +79001234567",
        "Fallback: укажите email на вкладке «Телефон» — код придёт на почту, если SMS не дошло",
      ],
      emailDeliverability:
        "mail.ru / gmail: проверьте «Спам». Для надёжной доставки — Supabase → Auth → SMTP.",
    },
  });
}
