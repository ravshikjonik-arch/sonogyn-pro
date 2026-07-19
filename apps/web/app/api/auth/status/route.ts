import { NextResponse } from "next/server";

import { shouldAutoConfirmEmail } from "@/lib/auth/auto-confirm-email";
import {
  getAuthSessionMaxAgeDays,
  isDevAuthModeEnabled,
} from "@/lib/auth/dev-auth-mode";
import { resolveEmailConfirmRedirect } from "@/lib/auth/email-confirmation";
import { resolveAppOrigin } from "@/lib/auth/app-origin";
import { SUPABASE_DEV_AUTH_CHECKLIST, SUPABASE_PRODUCTION_AUTH_CHECKLIST } from "@/lib/auth/supabase-dashboard-checklist";
import { isTurnstileConfigured } from "@/lib/auth/verify-turnstile";
import { isCustomSmsAuthEnabled, resolveSmsProvider } from "@/lib/auth/sms-providers";
import { isAuthEmailOnly } from "@/lib/auth/auth-methods-config";
import { isSmtpConfigured } from "@/lib/mail/smtp-config";
import { supabaseOAuthCallbackUrl } from "@/lib/auth/social-auth-domains";
import { isAuthRuIdpOnly, isVkIdConfigured, isYandexIdConfigured } from "@/lib/auth/russian-idp";
import { readTelegramBotUsername } from "@/lib/auth/telegram-bot-config";
import { isPilotTelegramPrimary } from "@/lib/auth/auth-pilot-config";
import { isPilotAllowlistEnabled, PILOT_ALLOWLIST_MAX, readPilotAllowlist } from "@/lib/auth/pilot-allowlist";
import { isYooKassaConfigured, readYooKassaProPriceRub } from "@/lib/yookassa/config";
import { TelegramService, readTelegramAdminIds } from "@/services/telegram";
import { isFullDiagnosticsAllowed } from "@/lib/security/diagnostics-access";

export const runtime = "nodejs";

/** Публичная диагностика auth (без секретов). */
export async function GET(req: Request) {
  const full = isFullDiagnosticsAllowed(req);
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
    issues.push(
      "SUPABASE_SERVICE_ROLE_KEY не задан — вход по SMS/Google/Telegram и auto-confirm email не работают",
    );
  }

  const smsProvider = resolveSmsProvider();
  const customSms = isCustomSmsAuthEnabled();
  const smsIssues: string[] = [];

  if (isAuthEmailOnly()) {
    smsIssues.push("AUTH_EMAIL_ONLY: SMS и Google отключены — только email + пароль");
  } else if (process.env.NODE_ENV === "production") {
    if (!customSms || smsProvider === "mock") {
      smsIssues.push(
        "Production: задайте SMS_PROVIDER=smsru + SMSRU_API_ID (или Twilio) на Vercel",
      );
    }
    if (!process.env.SMSRU_API_ID?.trim() && !process.env.TWILIO_ACCOUNT_SID?.trim()) {
      smsIssues.push("SMSRU_API_ID или TWILIO_* не заданы — реальные SMS не отправятся");
    }
  } else if (smsProvider === "mock") {
    smsIssues.push(
      "Dev: SMS mock — код OTP смотрите в консоли сервера ([auth:sms] mock_sent). Для реальных SMS: SMS_PROVIDER=smsru + SMSRU_API_ID",
    );
  }

  if (!process.env.TELEGRAM_BOT_TOKEN?.trim()) {
    smsIssues.push("TELEGRAM_BOT_TOKEN не задан (опционально, Telegram убран из UI)");
  }
  if (appOrigin.includes("localhost")) {
    issues.push("APP origin указывает на localhost — ссылки в письмах будут неверными");
  }

  if (!full) {
    return NextResponse.json({
      ok: issues.length === 0,
      issueCount: issues.length,
      telegramBotUsername: readTelegramBotUsername(),
      features: {
        authEmailOnly: isAuthEmailOnly(),
        emailAutoConfirm: shouldAutoConfirmEmail(),
        smtpConfigured: isSmtpConfigured(),
        smsReady: customSms && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
        yookassaConfigured: isYooKassaConfigured(),
      },
    });
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
      readTelegramBotUsername() ||
      process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim() ||
      process.env.TELEGRAM_BOT_USERNAME?.trim() ||
      "",
    pilot: {
      closedAccess: isPilotAllowlistEnabled(),
      allowlistCount: readPilotAllowlist().length,
      allowlistMax: PILOT_ALLOWLIST_MAX,
      telegramPrimary: isPilotTelegramPrimary(),
      simpleTelegramLogin: isPilotTelegramPrimary() || isPilotAllowlistEnabled(),
    },
    features: {
      authEmailOnly: isAuthEmailOnly(),
      smtpConfigured: isSmtpConfigured(),
      emailAutoConfirm: shouldAutoConfirmEmail(),
      telegramReady: Boolean(
        process.env.TELEGRAM_BOT_TOKEN?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
      ),
      turnstileConfigured: isTurnstileConfigured(),
      smsProvider: smsProvider,
      customSmsAuth: customSms,
      smsReady: customSms && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
      yookassaConfigured: isYooKassaConfigured(),
      yookassaProPriceRub: readYooKassaProPriceRub(),
      telegramNotifyConfigured: TelegramService.isConfigured(),
      telegramAdminCount: readTelegramAdminIds().length,
    },
    issues: [...issues, ...smsIssues],
    hints: {
      supabaseSiteUrl: appOrigin,
      supabaseRedirectUrls: [`${appOrigin}/auth/callback`, `${appOrigin}/**`],
      supabaseDashboard:
        process.env.NODE_ENV === "production"
          ? SUPABASE_PRODUCTION_AUTH_CHECKLIST
          : SUPABASE_DEV_AUTH_CHECKLIST,
      devAuthEnv: [
        "DEV_AUTH_MODE=true          # только local npm run dev",
        "AUTH_SESSION_MAX_AGE_DAYS=90",
        "AUTH_AUTO_CONFIRM_EMAIL=true",
        "SUPABASE_SERVICE_ROLE_KEY=… # из Dashboard → API",
        "DEV_AUTO_LOGIN=true         # опционально: вход без формы при открытии /",
      ],
      telegram: [
        "Admin-уведомления: TELEGRAM_BOT_TOKEN + TELEGRAM_ADMIN_IDS (см. apps/web/services/TELEGRAM_SETUP.md)",
        "BotFather → /newbot → Token → Vercel env",
        "chat_id: getUpdates после /start у бота",
        "РФ: уведомления с сервера Vercel — VPN на телефоне не нужен",
        "Вход пользователей: вкладки Почта / Телефон / Google на /login (без Telegram Widget)",
      ],
      googleOAuth: [
        "Google Cloud → Credentials → OAuth 2.0 → Authorized redirect URIs:",
        supabaseOAuthCallbackUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
        "Supabase → Providers → Google → Client ID + Secret",
        "Supabase Site URL: https://sonogyn-pro.ru (не http)",
      ],
      phoneSms: [
        "РФ (production): SMS.ru — SMS_PROVIDER=smsru + SMSRU_API_ID на Vercel",
        "Dev: SMS_PROVIDER=mock (по умолчанию) — код в консоли `npm run dev`",
        "Обязательно: SUPABASE_SERVICE_ROLE_KEY для сессии после SMS-кода",
        "Проверка: node apps/web/scripts/check-sms-connection.mjs",
        "Формат номера: +79001234567",
        "Fallback: email на вкладке «Телефон», если SMS не дошло",
      ],
      yookassa: [
        "ЮKassa (РФ): YOOKASSA_SHOP_ID + YOOKASSA_SECRET_KEY на Vercel",
        "Webhook в кабинете ЮKassa: https://sonogyn-pro.ru/api/payment/webhook",
        "Событие: payment.succeeded. Проверка IP ЮKassa + повторный запрос статуса в API.",
        "TELEGRAM_ADMIN_IDS — уведомления: регистрация, оплата, ошибки SMS/платежа",
        "YOOKASSA_PRO_PRICE_RUB=990 (опционально)",
        "Миграции: 20260617140000_yookassa_payments.sql, 20260619130000_payments.sql",
      ],
      emailDeliverability:
        "mail.ru / gmail: проверьте «Спам». Supabase Auth SMTP и Vercel SMTP_* — один ящик Sonogyn-pro@mail.ru (smtp.mail.ru:465).",
      supabaseSmtp: [
        "Supabase → Authentication → SMTP: host smtp.mail.ru, port 465 (или 587)",
        "User Sonogyn-pro@mail.ru · Pass — пароль приложения Mail.ru (не основной пароль ящика)",
        "Sender: SonoGyn Pro <Sonogyn-pro@mail.ru>",
        "Те же SMTP_USER / SMTP_PASSWORD что в Vercel env",
        "Отключить: Providers → Google OFF, Phone OFF",
      ],
    },
  });
}
