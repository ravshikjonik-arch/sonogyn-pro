/** Сообщения об ошибках вызова Auth на сервере (Next → Supabase). */
export function isLikelySupabaseNetworkError(message: string): boolean {
  return /failed to fetch|\bfetch failed\b|ENOTFOUND|getaddrinfo|ECONNREFUSED|ETIMEDOUT|network/i.test(message);
}

/** UX для типичного сбоя fetch к Supabase из браузера */
export function explainAuthNetworkFailure(message: string): string {
  if (/email signups are disabled/i.test(message)) {
    return (
      "Регистрация по email отключена в Supabase. В dashboard.supabase.com → ваш проект → " +
      "Authentication → Providers → Email: включите провайдер и разрешите регистрацию (Enable sign ups). " +
      "Также: Authentication → Settings (или Sign In / Up) → «Allow new users to sign up» = включено. " +
      "Сохраните и попробуйте регистрацию снова."
    );
  }

  if (
    /failed to fetch|\bfetch failed\b|networkerror|network request failed|load failed|ENOTFOUND|getaddrinfo|ECONNREFUSED|ETIMEDOUT/i.test(
      message,
    )
  ) {
    return (
      "Не удалось связаться с Supabase (ошибка сети). Проверьте: " +
      "1) в apps/web/.env.local заданы NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY без лишних кавычек; " +
      "2) после правки .env полностью перезапустите dev-сервер; " +
      "3) проект в Supabase Dashboard не на паузе; " +
      "4) выключите VPN, попробуйте другой Wi‑Fi или интернет с телефона; на Mac можно временно указать DNS 1.1.1.1 или 8.8.8.8 в настройках сети; " +
      "5) в браузере откройте ваш Project URL из Supabase (https://….supabase.co) — если страница не открывается, дело в сети/DNS, а не в пароле; " +
      "6) вход по паролю идёт через /api/auth/sign-in; при dev откройте /api/debug/supabase — если ok:false, сервер Next тоже не достучался до Supabase; " +
      "7) в Supabase → Settings → API попробуйте legacy-ключ anon JWT (eyJ…), если только sb_publishable_."
    );
  }
  return message;
}
