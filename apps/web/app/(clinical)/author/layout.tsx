import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AuthorShell } from "@/components/author/AuthorShell";
import { isAuthorRole } from "@/lib/courses/access";
import { getClinicalRole } from "@/lib/security/require-clinical-role";
import { createClient } from "@/utils/supabase/server";

export default async function AuthorLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectedFrom=/author");
  }

  const role = await getClinicalRole(supabase, user.id);
  if (!isAuthorRole(role)) {
    redirect("/app");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <AuthorShell>{children}</AuthorShell>
    </div>
  );
}
