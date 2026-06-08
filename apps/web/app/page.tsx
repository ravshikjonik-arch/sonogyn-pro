import { redirect } from "next/navigation";

import { getDevLoginConfig, isDevAutoLoginEnabled, isDevSkipAuthEnabled } from "@/lib/auth/dev-account";
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

  if (isDevAutoLoginEnabled() && getDevLoginConfig()) {
    redirect("/api/auth/dev-login?next=/app");
  }

  redirect("/landing");
}
