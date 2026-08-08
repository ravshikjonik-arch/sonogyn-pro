import { redirect } from "next/navigation";

import { canDevAutoLoginRedirect, getDevLoginConfig, isDevAutoLoginEnabled, isDevSkipAuthEnabled } from "@/lib/auth/dev-account";

/**
 * Open access: врач открывает sonogyn-pro.ru → сразу кабинет.
 * Логин нужен только для PHI / сохранения / PRO (см. middleware AUTH_REQUIRED).
 */
export default function RootPage() {
  if (isDevSkipAuthEnabled()) {
    redirect("/app");
  }

  if (canDevAutoLoginRedirect()) {
    redirect("/api/auth/dev-login?next=/app");
  }

  if (isDevAutoLoginEnabled() && getDevLoginConfig() && !canDevAutoLoginRedirect()) {
    redirect("/login?dev_setup=service_role");
  }

  redirect("/app");
}
