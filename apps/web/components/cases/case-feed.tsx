"use client";

import { MessageCircle, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useSupabase } from "@/app/providers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { loadDiscussionChannels, type DiscussionChannel } from "@/lib/chat/load-discussion-channels";

/** Row from GET /api/cases (public.cases + orads/tags). */
export type TeachingGalleryCaseRow = {
  id: string;
  title: string;
  description: string | null;
  anatomy: string | null;
  pathology: string | null;
  difficulty: string | null;
  status: string;
  is_public: boolean;
  channel_id: string | null;
  created_at: string;
  user_id: string;
  orads_category: number | null;
  tags: string[];
};

type FeedMode = "library" | "discussions";

type CaseFeedProps = {
  topic?: "all" | "prolapse";
  /** Pre-select discussion section (doctor_chat_channels.id). */
  initialChannelId?: string | null;
  /** library = teaching gallery; discussions = colleague questions. */
  initialFeedMode?: FeedMode;
};

type FeedFilters = {
  q: string;
  orads: string;
  tags: string;
  queue: "gallery" | "review";
  feedMode: FeedMode;
  channelId: string | null;
};

const ORADS_OPTIONS = ["", "0", "1", "2", "3", "4", "5"] as const;

export function CaseFeed({
  topic,
  initialChannelId = null,
  initialFeedMode = "library",
}: CaseFeedProps) {
  const supabase = useSupabase();
  const [channels, setChannels] = useState<DiscussionChannel[]>([]);
  const [cases, setCases] = useState<TeachingGalleryCaseRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isModerator, setIsModerator] = useState(false);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [draftFilters, setDraftFilters] = useState<{ q: string; orads: string; tags: string }>({
    q: "",
    orads: "",
    tags: "",
  });
  const [appliedFilters, setAppliedFilters] = useState<FeedFilters>({
    q: "",
    orads: "",
    tags: "",
    queue: "gallery",
    feedMode: initialFeedMode,
    channelId: initialChannelId,
  });

  useEffect(() => {
    void loadDiscussionChannels(supabase).then(setChannels);
  }, [supabase]);

  const refresh = useCallback(async () => {
    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user.id ?? null;
    setUserId(uid);

    if (uid) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", uid)
        .maybeSingle();
      const role = profile?.role as string | undefined;
      setIsModerator(role === "moderator" || role === "admin");
    } else {
      setIsModerator(false);
    }

    const params = new URLSearchParams();
    if (appliedFilters.q.trim()) params.set("q", appliedFilters.q.trim());
    if (appliedFilters.orads) params.set("orads", appliedFilters.orads);
    if (appliedFilters.tags.trim()) params.set("tags", appliedFilters.tags.trim());
    if (appliedFilters.queue === "review") params.set("status", "review");
    if (topic === "prolapse") params.set("topic", "prolapse");
    if (appliedFilters.feedMode === "library") params.set("feedMode", "library");
    if (appliedFilters.feedMode === "discussions") {
      params.set("feedMode", "discussions");
      if (appliedFilters.channelId) params.set("channelId", appliedFilters.channelId);
    }

    const res = await fetch(`/api/cases?${params.toString()}`);
    const payload = (await res.json().catch(() => null)) as
      | { cases?: TeachingGalleryCaseRow[]; error?: string }
      | null;

    if (!res.ok) {
      toast.error(payload?.error ?? "Не удалось загрузить кейсы");
      setCases([]);
      setLoading(false);
      return;
    }

    const list = payload?.cases ?? [];
    setCases(list);

    if (list.length) {
      const ids = list.map((r) => r.id);
      const { data: commentRows } = await supabase
        .from("teaching_case_comments")
        .select("case_id")
        .in("case_id", ids);
      const counts: Record<string, number> = {};
      commentRows?.forEach((row: { case_id: string }) => {
        counts[row.case_id] = (counts[row.case_id] ?? 0) + 1;
      });
      setCommentCounts(counts);
    } else {
      setCommentCounts({});
    }

    if (uid && list.length) {
      const ids = list.map((r) => r.id);
      const [{ data: likes }, { data: marks }] = await Promise.all([
        supabase.from("teaching_case_likes").select("case_id").eq("user_id", uid).in("case_id", ids),
        supabase.from("teaching_case_bookmarks").select("case_id").eq("user_id", uid).in("case_id", ids),
      ]);
      const likeMap: Record<string, boolean> = {};
      const bookMap: Record<string, boolean> = {};
      likes?.forEach((row: { case_id: string }) => {
        likeMap[row.case_id] = true;
      });
      marks?.forEach((row: { case_id: string }) => {
        bookMap[row.case_id] = true;
      });
      setLiked(likeMap);
      setBookmarked(bookMap);
    }

    setLoading(false);
  }, [supabase, topic, appliedFilters]);

  useEffect(() => {
    queueMicrotask(() => void refresh());
  }, [refresh]);

  useEffect(() => {
    const channel = supabase
      .channel("teaching_cases_feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "cases" }, () => void refresh())
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "teaching_case_comments" },
        () => void refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, refresh]);

  const filterSummary = useMemo(() => {
    const parts: string[] = [];
    if (appliedFilters.q.trim()) parts.push(`поиск «${appliedFilters.q.trim()}»`);
    if (appliedFilters.orads) parts.push(`O-RADS ${appliedFilters.orads}`);
    if (appliedFilters.tags.trim()) parts.push(`теги: ${appliedFilters.tags.trim()}`);
    if (appliedFilters.queue === "review") parts.push("очередь эксперта");
    if (appliedFilters.feedMode === "discussions") {
      const ch = channels.find((c) => c.id === appliedFilters.channelId);
      parts.push(ch ? `вопросы · ${ch.title}` : "вопросы коллегам");
    } else {
      parts.push("учебная библиотека");
    }
    return parts.length ? parts.join(" · ") : "все опубликованные";
  }, [appliedFilters, channels]);

  function applyDraftFilters() {
    setAppliedFilters((prev) => ({ ...prev, ...draftFilters }));
  }

  function switchFeedMode(feedMode: FeedMode) {
    setAppliedFilters((prev) => ({
      ...prev,
      feedMode,
      channelId: feedMode === "discussions" ? prev.channelId : null,
    }));
  }

  function switchChannel(channelId: string | null) {
    setAppliedFilters((prev) => ({ ...prev, feedMode: "discussions", channelId }));
  }

  const activeChannel = channels.find((c) => c.id === appliedFilters.channelId);

  async function toggleChannelSubscription() {
    if (!userId || !appliedFilters.channelId) {
      toast.message("Выберите раздел и войдите");
      return;
    }
    const channelId = appliedFilters.channelId;
    const { data: existing } = await supabase
      .from("channel_subscriptions")
      .select("user_id")
      .eq("user_id", userId)
      .eq("channel_id", channelId)
      .maybeSingle();

    if (existing) {
      await supabase.from("channel_subscriptions").delete().eq("user_id", userId).eq("channel_id", channelId);
      toast.success("Подписка на раздел отключена");
    } else {
      await supabase.from("channel_subscriptions").insert({ user_id: userId, channel_id: channelId });
      toast.success("Push при новых вопросах в разделе включён");
    }
  }

  function switchQueue(queue: FeedFilters["queue"]) {
    setAppliedFilters((prev) => ({ ...prev, queue }));
  }

  async function toggleLike(caseId: string) {
    if (!userId) {
      toast.message("Нужна авторизация");
      return;
    }
    const active = liked[caseId];
    if (active) {
      await supabase.from("teaching_case_likes").delete().eq("case_id", caseId).eq("user_id", userId);
      setLiked((prev) => ({ ...prev, [caseId]: false }));
    } else {
      await supabase.from("teaching_case_likes").insert({ case_id: caseId, user_id: userId });
      setLiked((prev) => ({ ...prev, [caseId]: true }));
    }
  }

  async function toggleBookmark(caseId: string) {
    if (!userId) {
      toast.message("Нужна авторизация");
      return;
    }
    const active = bookmarked[caseId];
    if (active) {
      await supabase.from("teaching_case_bookmarks").delete().eq("case_id", caseId).eq("user_id", userId);
      setBookmarked((prev) => ({ ...prev, [caseId]: false }));
    } else {
      await supabase.from("teaching_case_bookmarks").insert({ case_id: caseId, user_id: userId });
      setBookmarked((prev) => ({ ...prev, [caseId]: true }));
    }
  }

  function handleExpertReviewStub(caseId: string) {
    toast.message("Очередь эксперта — скоро", {
      description: `Кейс ${caseId.slice(0, 8)}… будет доступен для рецензии в Phase 2.`,
    });
  }

  async function seedProlapseDemoCase() {
    if (!userId) {
      toast.error("Войдите, чтобы создать демо-кейс");
      return;
    }
    const { error } = await supabase.from("cases").insert({
      user_id: userId,
      title: "POP-Q Stage II · цистоцеле · разбор",
      description:
        "Постменопауза, жалобы на «шарик», Ba +1 см, TVL 9 см. Обсудите тактику: наблюдение vs операция (учебный кейс, без PHI).",
      anatomy: "Тазовое дно / POP-Q",
      pathology: "POP-Q",
      difficulty: "intermediate",
      status: "published",
      is_public: true,
      tags: ["pop-q", "prolapse"],
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Демо-кейс пролапса добавлен");
    void refresh();
  }

  async function seedDemoCase() {
    if (!userId) {
      toast.error("Войдите, чтобы создать демо-кейс");
      return;
    }
    const { error } = await supabase.from("cases").insert({
      user_id: userId,
      title: "Демо · многокамерная кистозная масса",
      description:
        "54 года, случайная находка слева. Обсудите категорию O-RADS и тактику наблюдения (учебный кейс, без PHI).",
      anatomy: "Adnexa",
      pathology: "Cystic mass",
      difficulty: "intermediate",
      status: "published",
      is_public: true,
      orads_category: 3,
      tags: ["cystic", "adnexa", "o-rads"],
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Демо-кейс добавлен в галерею");
    void refresh();
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Синхронизация ленты…</p>;
  }

  return (
    <div className="space-y-4">
      {topic === "prolapse" ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-xs text-rose-950">
          Лента «Пролапс · разбор» — кейсы с POP-Q, выпадением и опущением ОМТ. Без PHI.
        </p>
      ) : null}

      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Поиск и фильтры</CardTitle>
          <CardDescription>{filterSummary}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-9"
                placeholder="Заголовок или описание…"
                value={draftFilters.q}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, q: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyDraftFilters();
                }}
              />
            </div>
            <select
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm sm:w-[140px]"
              value={draftFilters.orads || "all"}
              onChange={(e) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  orads: e.target.value === "all" ? "" : e.target.value,
                }))
              }
            >
              <option value="all">O-RADS · все</option>
              {ORADS_OPTIONS.filter(Boolean).map((v) => (
                <option key={v} value={v}>
                  O-RADS {v}
                </option>
              ))}
            </select>
            <Input
              className="sm:w-[180px]"
              placeholder="Теги (через запятую)"
              value={draftFilters.tags}
              onChange={(e) => setDraftFilters((prev) => ({ ...prev, tags: e.target.value }))}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={appliedFilters.feedMode === "library" ? "default" : "secondary"}
              type="button"
              onClick={() => switchFeedMode("library")}
            >
              Библиотека кейсов
            </Button>
            <Button
              size="sm"
              variant={appliedFilters.feedMode === "discussions" ? "default" : "secondary"}
              type="button"
              onClick={() => switchFeedMode("discussions")}
            >
              Вопросы коллегам
            </Button>
          </div>
          {appliedFilters.feedMode === "discussions" ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[var(--clinical-foreground-muted)]">Раздел · специализация</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => switchChannel(null)}
                  className={cn(
                    "rounded-xl border px-3 py-1.5 text-xs transition",
                    !appliedFilters.channelId
                      ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)] font-bold"
                      : "border-[var(--clinical-border)] hover:bg-[var(--clinical-muted)]",
                  )}
                >
                  Все разделы
                </button>
                {channels.map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => switchChannel(ch.id)}
                    className={cn(
                      "rounded-xl border px-3 py-1.5 text-xs transition",
                      appliedFilters.channelId === ch.id
                        ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)] font-bold"
                        : "border-[var(--clinical-border)] hover:bg-[var(--clinical-muted)]",
                    )}
                  >
                    {ch.title}
                  </button>
                ))}
              </div>
              {appliedFilters.channelId ? (
                <Button size="sm" variant="outline" type="button" onClick={() => void toggleChannelSubscription()}>
                  {activeChannel ? `Push · ${activeChannel.title}` : "Подписаться на push"}
                </Button>
              ) : null}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={appliedFilters.queue === "gallery" ? "default" : "secondary"}
              type="button"
              onClick={() => switchQueue("gallery")}
            >
              Опубликованные
            </Button>
            {isModerator ? (
              <Button
                size="sm"
                variant={appliedFilters.queue === "review" ? "default" : "secondary"}
                type="button"
                className="gap-1"
                onClick={() => switchQueue("review")}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Очередь эксперта
              </Button>
            ) : null}
            <Button size="sm" type="button" onClick={applyDraftFilters}>
              Применить
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button size="sm" type="button" asChild variant="default">
          <Link
            href={
              appliedFilters.feedMode === "discussions"
                ? `/cases/new?feed=discussions${
                    appliedFilters.channelId ? `&channelId=${appliedFilters.channelId}` : ""
                  }`
                : "/cases/new"
            }
          >
            Новый кейс для обсуждения
          </Link>
        </Button>
        {topic === "prolapse" ? (
          <Button size="sm" type="button" onClick={() => void seedProlapseDemoCase()}>
            Демо · POP-Q
          </Button>
        ) : (
          <Button size="sm" type="button" onClick={() => void seedDemoCase()}>
            Демо-кейс в ленту
          </Button>
        )}
        <Button size="sm" variant="secondary" type="button" onClick={() => void refresh()}>
          Обновить
        </Button>
      </div>

      {cases.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {appliedFilters.queue === "review"
                ? "Очередь эксперта пуста"
                : topic === "prolapse"
                  ? "Пока нет кейсов по пролапсу"
                  : "Лента пуста — начните обсуждение"}
            </CardTitle>
            <CardDescription>
              {appliedFilters.queue === "review"
                ? "Кейсы со статусом review появятся здесь после отправки на модерацию."
                : topic === "prolapse"
                  ? "Создайте кейс из калькулятора POP-Q или нажмите «Демо · POP-Q»."
                  : "Создайте первый кейс с фото УЗИ или нажмите «Демо-кейс». Нужны миграции Supabase и вход врача."}
            </CardDescription>
          </CardHeader>
          {topic === "prolapse" ? (
            <CardContent>
              <Button variant="outline" size="sm" asChild>
                <Link href="/calculators/pop-q">Открыть POP-Q →</Link>
              </Button>
            </CardContent>
          ) : null}
        </Card>
      ) : (
        <div className="space-y-4">
          {cases.map((c) => (
            <Card key={c.id} className="border-slate-200">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-lg">
                    <Link href={`/cases/${c.id}`} className="hover:underline">
                      {c.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">{c.description ?? "—"}</CardDescription>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline">{c.anatomy ?? "анатомия не указана"}</Badge>
                    {c.orads_category != null ? (
                      <Badge className="bg-violet-600">O-RADS {c.orads_category}</Badge>
                    ) : null}
                    {c.pathology === "POP-Q" ? <Badge className="bg-rose-600">POP-Q</Badge> : null}
                    <Badge variant="outline">{c.status}</Badge>
                    {c.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                    {c.user_id === userId ? <Badge variant="outline">мой кейс</Badge> : null}
                    {c.channel_id ? (
                      <Badge className="bg-emerald-700">вопрос коллегам</Badge>
                    ) : null}
                    {(commentCounts[c.id] ?? 0) > 0 ? (
                      <Badge variant="outline" className="gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {commentCounts[c.id]} сообщ.
                      </Badge>
                    ) : null}
                    <span className="text-xs text-slate-400">{new Date(c.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {appliedFilters.queue === "review" && isModerator ? (
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      className={cn("gap-1")}
                      onClick={() => handleExpertReviewStub(c.id)}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Рецензия
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant={liked[c.id] ? "default" : "secondary"}
                    type="button"
                    onClick={() => void toggleLike(c.id)}
                  >
                    Лайк
                  </Button>
                  <Button
                    size="sm"
                    variant={bookmarked[c.id] ? "default" : "secondary"}
                    type="button"
                    onClick={() => void toggleBookmark(c.id)}
                  >
                    Закладка
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/cases/${c.id}`}>Открыть обсуждение →</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
