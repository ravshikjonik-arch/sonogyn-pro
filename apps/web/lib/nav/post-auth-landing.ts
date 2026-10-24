import type { User } from "@supabase/supabase-js";

import { GUEST_DEMO_EMAIL } from "@/lib/auth/guest-demo-account";

/** Полный кабинет с ClinicalChrome (меню, чат, калькуляторы). */
export const AUTHENTICATED_HOME_PATH = "/profile/dashboard";

/** Лёгкая open-access главная без оболочки (гости / демо). */
export const OPEN_ACCESS_HOME_PATH = "/home";

export function defaultPostAuthPath(): string {
  return AUTHENTICATED_HOME_PATH;
}

export function isOpenAccessDemoUser(user: User | null | undefined): boolean {
  const email = user?.email?.trim().toLowerCase();
  if (!email) return false;
  return email === GUEST_DEMO_EMAIL.toLowerCase();
}
