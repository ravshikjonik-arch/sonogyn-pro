"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useSupabase } from "@/app/providers";
import { Button } from "@/components/ui/button";

/**
 * Guided intake for anonymized teaching cases — persists draft rows for subsequent media upload flows.
 */
export default function NewCasePage() {
  const supabase = useSupabase();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [anatomy, setAnatomy] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createDraft(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      setError("Session expired — please sign in again.");
      setBusy(false);
      return;
    }

    const { data, error: insertErr } = await supabase
      .from("cases")
      .insert({
        user_id: session.user.id,
        title: title.trim() || "Untitled teaching case",
        anatomy: anatomy.trim() || null,
        status: "draft",
        is_public: false,
      })
      .select("id")
      .single();

    if (insertErr || !data?.id) {
      setError(insertErr?.message ?? "Unable to create case.");
      setBusy(false);
      return;
    }

    router.push(`/cases/${data.id}`);
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-6 py-12">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--clinical-foreground-muted)]">
          Teaching gallery
        </p>
        <h1 className="text-3xl font-black tracking-tight text-[var(--clinical-foreground)]">Create anonymized case</h1>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          No PHI — attach synthetic media or scrubbed teaching datasets after saving this draft shell.
        </p>
      </header>

      <form className="space-y-6 rounded-2xl border border-[var(--clinical-border)] bg-white p-8 shadow-sm" onSubmit={createDraft}>
        <label className="flex flex-col gap-2 text-sm font-semibold text-[var(--clinical-foreground)]">
          Title
          <input
            className="rounded-lg border border-[var(--clinical-border)] px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-[var(--clinical-primary)]"
            placeholder="e.g., Hepatic hemangioma pattern recognition"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold text-[var(--clinical-foreground)]">
          Anatomy focus
          <input
            className="rounded-lg border border-[var(--clinical-border)] px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-[var(--clinical-primary)]"
            placeholder="e.g., Liver / OB-GYN / MSK"
            value={anatomy}
            onChange={(event) => setAnatomy(event.target.value)}
          />
        </label>
        {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save draft"}
          </Button>
          <Button variant="outline" type="button" asChild>
            <Link href="/cases">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
