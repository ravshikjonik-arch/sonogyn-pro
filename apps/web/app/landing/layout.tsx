import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { createClient } from "@/utils/supabase/server";

/** Уже вошёл — сразу в кабинет, без лендинга. */
export default async function LandingLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect("/app");
  }

  return children;
}
