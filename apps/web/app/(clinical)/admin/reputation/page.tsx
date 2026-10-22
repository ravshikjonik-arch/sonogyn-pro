import Link from "next/link";
import { redirect } from "next/navigation";

import { ReputationModerationPanel } from "@/components/admin/ReputationModerationPanel";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";

export default async function AdminReputationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectedFrom=/admin/reputation");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const allowed = profile?.role === "admin" || profile?.role === "moderator";
  if (!allowed) {
    redirect("/app");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-12">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--clinical-foreground-muted)]">
          Доверие
        </p>
        <h1 className="text-3xl font-black tracking-tight text-[var(--clinical-foreground)]">
          Репутация и модерация
        </h1>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          Штрафы и избранные кейсы (+25) пишутся в <code className="text-xs">reputation_events</code>.
          Backfill:{" "}
          <code className="text-xs">node apps/web/scripts/backfill-reputation.mjs</code> (service role).
        </p>
      </header>

      <ReputationModerationPanel />

      <Button asChild variant="outline" size="sm">
        <Link href="/admin">← Админ-раздел</Link>
      </Button>
    </div>
  );
}
