import { redirect } from "next/navigation";

import { canDevAutoLoginRedirect, getDevLoginConfig, isDevAutoLoginEnabled, isDevSkipAuthEnabled } from "@/lib/auth/dev-account";
import { createClient } from "@/utils/supabase/server";

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect("/app");
  }

  if (isDevSkipAuthEnabled()) {
    redirect("/app");
  }

  if (canDevAutoLoginRedirect()) {
    redirect("/api/auth/dev-login?next=/app");
  }

  if (isDevAutoLoginEnabled() && getDevLoginConfig() && !canDevAutoLoginRedirect()) {
    redirect("/login?dev_setup=service_role");
  }

  redirect("/landing");
}
