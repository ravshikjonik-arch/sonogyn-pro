/** Домены для BotFather /setdomain (Telegram Login Widget). */
export const TELEGRAM_LOGIN_DOMAINS = [
  "sonogyn-pro.ru",
  "www.sonogyn-pro.ru",
  "sonogyn-pro-web-ravshan-s-projects3.vercel.app",
  "localhost",
] as const;

export function supabaseGoogleCallbackUrl(supabaseProjectUrl?: string): string {
  const base =
    supabaseProjectUrl?.trim().replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "") ||
    "";
  if (!base) return "https://YOUR_PROJECT.supabase.co/auth/v1/callback";
  return `${base}/auth/v1/callback`;
}
