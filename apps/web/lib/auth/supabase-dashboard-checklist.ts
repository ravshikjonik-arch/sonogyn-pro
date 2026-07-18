/** Подсказки для Supabase Dashboard (dev / staging). Без секретов. */
export type SupabaseAuthChecklistItem = {
  id: string;
  area: string;
  setting: string;
  recommended: string;
  why: string;
};

export const SUPABASE_PRODUCTION_AUTH_CHECKLIST: SupabaseAuthChecklistItem[] = [
  {
    id: "site-url",
    area: "Authentication → URL Configuration",
    setting: "Site URL",
    recommended: "https://sonogyn-pro.ru",
    why: "Ссылки в письмах, SMS и OAuth redirectTo должны совпадать с NEXT_PUBLIC_APP_URL на Vercel.",
  },
  {
    id: "redirect-urls",
    area: "Authentication → URL Configuration",
    setting: "Redirect URLs",
    recommended:
      "https://sonogyn-pro.ru/auth/callback, https://sonogyn-pro.ru/auth/reset-password, https://sonogyn-pro.ru/**, https://*.vercel.app/** (preview)",
    why: "Обязательно /auth/callback после email-link и OAuth.",
  },
  {
    id: "custom-smtp",
    area: "Authentication → SMTP Settings",
    setting: "Custom SMTP (Mail.ru)",
    recommended:
      "Host smtp.mail.ru · Port 587 · User Sonogyn-pro@mail.ru · Pass — пароль приложения · Sender email строго Sonogyn-pro@mail.ru (имя: SonoGyn Pro)",
    why: "Mail.ru отклоняет письма, если Sender ≠ SMTP User (ошибка 550 not local sender over smtp). Подтверждение регистрации идёт через Supabase Auth SMTP.",
  },
  {
    id: "recovery-email-template",
    area: "Authentication → Email Templates → Reset password",
    setting: "Recovery link (TokenHash, cross-browser)",
    recommended:
      "{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/auth/reset-password?recovery=1",
    why: "PKCE через {{ .ConfirmationURL }} ломается в другом браузере/Gmail → otp_expired. TokenHash + verifyOtp работает везде.",
  },
  {
    id: "providers-ru",
    area: "Authentication → Providers",
    setting: "Google OFF · VK ON · Yandex ON · Phone OFF (custom SMS.ru)",
    recommended: "Email + VK + Yandex; Phone через apps/web SMS.ru, не Supabase Phone",
    why: "199-ФЗ / КоАП 13.55: иностранные IdP (Google, Apple) для пользователей из РФ не использовать. SMS.ru — основной телефонный вход.",
  },
  {
    id: "providers-off",
    area: "Authentication → Providers",
    setting: "Google OFF (legacy AUTH_EMAIL_ONLY)",
    recommended: "Не включать Google даже для staging с RU-трафиком",
    why: "Mobile раньше показывал Google — убрано. Дублируйте OFF в Dashboard.",
  },
  {
    id: "confirm-email",
    area: "Authentication → Providers → Email",
    setting: "Confirm email",
    recommended: "ON + SUPABASE_SERVICE_ROLE_KEY на Vercel (auto-confirm на сервере)",
    why: "Без service role вход по email может зависнуть до клика по письму.",
  },
  {
    id: "service-role",
    area: "Project Settings → API",
    setting: "service_role key → SUPABASE_SERVICE_ROLE_KEY",
    recommended: "Только Vercel env, не в git",
    why: "SMS OTP, Telegram auth, auto-confirm email, webhook ЮKassa.",
  },
];

export const SUPABASE_DEV_AUTH_CHECKLIST: SupabaseAuthChecklistItem[] = [
  {
    id: "confirm-email",
    area: "Authentication → Providers → Email",
    setting: "Confirm email",
    recommended: "OFF для локальной разработки",
    why: "Иначе после регистрации вход блокируется до клика по письму. Альтернатива: оставить ON + DEV_AUTH_MODE + service role (auto-confirm на сервере).",
  },
  {
    id: "site-url",
    area: "Authentication → URL Configuration",
    setting: "Site URL",
    recommended: "http://localhost:3000 (dev) или ваш Vercel URL",
    why: "Ссылки в письмах и OAuth redirectTo должны совпадать с реальным origin.",
  },
  {
    id: "redirect-urls",
    area: "Authentication → URL Configuration",
    setting: "Redirect URLs",
    recommended: "http://localhost:3000/** и https://ВАШ-ДОМЕН/**",
    why: "Обязательно: /auth/callback после email-link и OAuth.",
  },
  {
    id: "jwt-expiry",
    area: "Authentication → Settings (или JWT)",
    setting: "JWT expiry",
    recommended: "3600 с (1 ч) — нормально",
    why: "Access token короткий; долгая сессия держится refresh token в HttpOnly cookie (90 д в DEV_AUTH_MODE).",
  },
  {
    id: "refresh-rotation",
    area: "Authentication → Settings",
    setting: "Refresh token rotation",
    recommended: "Enabled (по умолчанию)",
    why: "Безопасное продление сессии при каждом refresh.",
  },
  {
    id: "inactivity",
    area: "Authentication → Settings",
    setting: "Inactivity timeout / Time-box user sessions",
    recommended: "Выключить или ≥ 90 дней для dev",
    why: "Иначе Supabase принудительно разлогинит раньше, чем cookie приложения.",
  },
  {
    id: "service-role",
    area: "Project Settings → API",
    setting: "service_role key → SUPABASE_SERVICE_ROLE_KEY",
    recommended: "Только в apps/web/.env.local, не в git",
    why: "Нужен для server-side auto-confirm email и Telegram auth.",
  },
];
