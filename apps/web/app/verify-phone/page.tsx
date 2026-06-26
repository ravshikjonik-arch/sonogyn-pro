import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { VerifyPhoneForm } from "@/components/auth/VerifyPhoneForm";
import { isDevSkipAuthEnabled } from "@/lib/auth/dev-account";
import { needsPhoneVerification } from "@/lib/auth/phone-verified";
import { safeInternalPath } from "@/lib/nav/safe-redirect";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "Подтверждение телефона · SonoGyn Pro",
  description: "Подтвердите номер телефона для доступа к клиническому кабинету.",
};

type Props = { searchParams: Promise<{ redirectedFrom?: string }> };

export default async function VerifyPhonePage({ searchParams }: Props) {
  if (!isDevSkipAuthEnabled()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login?redirectedFrom=/verify-phone");
    }

    if (!needsPhoneVerification(user)) {
      const sp = await searchParams;
      redirect(safeInternalPath(sp.redirectedFrom ?? null, "/profile/dashboard"));
    }
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 to-white px-4 py-10 dark:from-slate-950 dark:to-slate-900">
      <Suspense fallback={<p className="text-center text-sm text-slate-500">Загрузка…</p>}>
        <VerifyPhoneForm />
      </Suspense>
    </main>
  );
}
