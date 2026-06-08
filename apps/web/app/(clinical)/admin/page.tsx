import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";

/**
 * Administrator moderation cockpit — gated entirely server-side via Supabase profile role.
 */
export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectedFrom=/admin");
  }

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).maybeSingle();

  if (!profile || profile.role !== "admin") {
    redirect("/app");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--clinical-foreground-muted)]">
          Administrator
        </p>
        <h1 className="text-3xl font-black tracking-tight text-[var(--clinical-foreground)]">Operations dashboard</h1>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          Signed in as <span className="font-semibold">{profile.full_name ?? user.email}</span>
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { title: "User directory", body: "Invite flows + MFA audit — wire Supabase Auth admin APIs." },
          { title: "Moderation queue", body: "Review flagged teaching cases before publication." },
          { title: "Analytics export", body: "Blend Firebase events with `analytics_events` SQL warehouse." },
        ].map((card) => (
          <div key={card.title} className="rounded-2xl border border-[var(--clinical-border)] bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-[var(--clinical-foreground)]">{card.title}</p>
            <p className="mt-2 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">{card.body}</p>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/admin/nosologies">Нозологии (редактор)</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/cases">Open cases gallery</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/app">Return to command center</Link>
        </Button>
      </div>
    </div>
  );
}
