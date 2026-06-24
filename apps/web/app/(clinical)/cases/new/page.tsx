"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useSupabase } from "@/app/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { loadDiscussionChannels, type DiscussionChannel } from "@/lib/chat/load-discussion-channels";
import { cn } from "@/lib/utils/cn";

type CaseKind = "library" | "discussion";

/**
 * Создание анонимизированного кейса для чата врачей.
 */
export default function NewCasePage() {
  const supabase = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [anatomy, setAnatomy] = useState("");
  const [caseKind, setCaseKind] = useState<CaseKind>("library");
  const [channelId, setChannelId] = useState<string>("");
  const [channels, setChannels] = useState<DiscussionChannel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = searchParams.get("title");
    const d = searchParams.get("description");
    const a = searchParams.get("anatomy");
    if (t) setTitle(t);
    if (d) setDescription(d);
    if (a) setAnatomy(a);

    const feed = searchParams.get("feed");
    const preselectedChannel = searchParams.get("channelId");
    if (feed === "discussions") setCaseKind("discussion");
    if (preselectedChannel) setChannelId(preselectedChannel);
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(async () => {
      setChannelsLoading(true);
      const rows = await loadDiscussionChannels(supabase);
      if (cancelled) return;
      setChannels(rows);
      setChannelsLoading(false);
      setChannelId((prev) => {
        if (prev && rows.some((ch) => ch.id === prev)) return prev;
        return rows[0]?.id ?? "";
      });
    });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function createDraft(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    if (caseKind === "discussion" && !channelId) {
      setError("Выберите раздел для вопроса коллегам.");
      setBusy(false);
      return;
    }

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
        pathology: searchParams.get("pathology")?.trim() || null,
        channel_id: caseKind === "discussion" ? channelId : null,
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
        <h1 className="text-3xl font-black tracking-tight text-[var(--clinical-foreground)]">
          Новый кейс для обсуждения
        </h1>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          Без PHI — после сохранения прикрепите фото/видео УЗИ и пригласите коллег к разбору в треде.
        </p>
      </header>

      <form
        className="space-y-6 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-8 shadow-sm"
        onSubmit={createDraft}
      >
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-[var(--clinical-foreground)]">Куда публикуем</legend>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={cn(
                "rounded-xl border px-4 py-2 text-sm transition",
                caseKind === "library"
                  ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)] font-bold"
                  : "border-[var(--clinical-border)] bg-[var(--clinical-card)] hover:bg-[var(--clinical-muted)]",
              )}
              onClick={() => setCaseKind("library")}
            >
              Учебная библиотека
            </button>
            <button
              type="button"
              className={cn(
                "rounded-xl border px-4 py-2 text-sm transition",
                caseKind === "discussion"
                  ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)] font-bold"
                  : "border-[var(--clinical-border)] bg-[var(--clinical-card)] hover:bg-[var(--clinical-muted)]",
              )}
              onClick={() => setCaseKind("discussion")}
            >
              Вопрос коллегам
            </button>
          </div>
          <p className="text-xs text-[var(--clinical-foreground-muted)]">
            {caseKind === "library"
              ? "Кейс попадёт в библиотеку без привязки к разделу."
              : "Кейс появится во вкладке «Вопросы коллегам» и может отправить push подписчикам раздела."}
          </p>
        </fieldset>

        {caseKind === "discussion" ? (
          <label className="flex flex-col gap-2 text-sm font-semibold text-[var(--clinical-foreground)]">
            Раздел
            <select
              className="h-10 w-full rounded-md border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 text-sm"
              value={channelId}
              disabled={channelsLoading || channels.length === 0}
              onChange={(event) => setChannelId(event.target.value)}
            >
              {channels.length === 0 ? (
                <option value="">Разделы загружаются…</option>
              ) : (
                channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.title}
                  </option>
                ))
              )}
            </select>
          </label>
        ) : null}

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
