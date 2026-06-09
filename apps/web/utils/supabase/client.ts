import type { SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

import { supabaseCookieOptions } from "@/utils/supabase/cookie-options";

/** Без throw — иначе SessionProvider валит всё приложение «белым экраном». */
export function createClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    return null;
  }

  try {
    new URL(url);
  } catch {
    return null;
  }

  try {
    return createBrowserClient(url, anonKey, { cookieOptions: supabaseCookieOptions() });
  } catch {
    return null;
  }
}
