/** Подсказки для Supabase Dashboard (dev / staging). Без секретов. */
export type SupabaseAuthChecklistItem = {
  id: string;
  area: string;
  setting: string;
  recommended: string;
  why: string;
};

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
