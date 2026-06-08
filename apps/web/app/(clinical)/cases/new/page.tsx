"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useSupabase } from "@/app/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/**
 * Создание анонимизированного кейса для чата врачей.
 */
export default function NewCasePage() {
  const supabase = useSupabase();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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
      setError("Сессия истекла — войдите снова.");
      setBusy(false);
      return;
    }

    const { data, error: insertErr } = await supabase
      .from("cases")
      .insert({
        user_id: session.user.id,
        title: title.trim() || "Кейс без названия",
        description: description.trim() || null,
        anatomy: anatomy.trim() || null,
        status: "draft",
        is_public: false,
      })
      .select("id")
      .single();

    if (insertErr || !data?.id) {
      setError(insertErr?.message ?? "Не удалось создать кейс.");
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
          Чат врачей
        </p>
        <h1 className="text-3xl font-black tracking-tight text-[var(--clinical-foreground)]">Новый кейс для обсуждения</h1>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          Без PHI — после сохранения прикрепите фото/видео УЗИ и пригласите коллег к разбору в треде.
        </p>
      </header>

      <form
        className="space-y-6 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-8 shadow-sm"
        onSubmit={createDraft}
      >
        <label className="flex flex-col gap-2 text-sm font-semibold text-[var(--clinical-foreground)]">
          Заголовок кейса
          <Input
            placeholder="напр. O-RADS 4 · кистозно-солидное образование левого яичника"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold text-[var(--clinical-foreground)]">
          Клинический вопрос
          <Textarea
            className="min-h-[120px] resize-y"
            placeholder="Что хотите обсудить с коллегами? Возрастная группа, находка, сомнения по тактике…"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold text-[var(--clinical-foreground)]">
          Зона УЗИ
          <Input
            placeholder="матка / яичники / ранняя беременность / МЖ"
            value={anatomy}
            onChange={(event) => setAnatomy(event.target.value)}
          />
        </label>
        {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? "Сохранение…" : "Создать и загрузить снимки"}
          </Button>
          <Button variant="outline" type="button" asChild>
            <Link href="/cases?tab=cases">Отмена</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
