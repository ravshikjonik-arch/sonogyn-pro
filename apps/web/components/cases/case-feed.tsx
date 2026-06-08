"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useSupabase } from "@/app/providers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Row from `public.cases` visible under RLS (own drafts + published gallery). */
export type TeachingGalleryCaseRow = {
  id: string;
  title: string;
  description: string | null;
  anatomy: string | null;
  pathology: string | null;
  difficulty: string | null;
  status: string;
  is_public: boolean;
  created_at: string;
  user_id: string;
};

export function CaseFeed() {
  const supabase = useSupabase();
  const [cases, setCases] = useState<TeachingGalleryCaseRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useMemo(
    () => async () => {
      setLoading(true);
      const [{ data: sessionData }, { data: rows, error }] = await Promise.all([
        supabase.auth.getSession(),
        supabase
          .from("cases")
          .select(
            "id,title,description,anatomy,pathology,difficulty,status,is_public,created_at,user_id",
          )
          .order("created_at", { ascending: false })
          .limit(60),
      ]);

      const uid = sessionData.session?.user.id ?? null;
      setUserId(uid);

      if (error) {
        toast.error("Не удалось загрузить кейсы — проверьте миграции Supabase.");
        setCases([]);
        setLoading(false);
        return;
      }

      setCases(((rows ?? []) as TeachingGalleryCaseRow[]));

      if (uid && rows?.length) {
        const ids = rows.map((r) => r.id);
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
    },
    [supabase],
  );

  useEffect(() => {
    queueMicrotask(() => void refresh());
  }, [refresh]);

  useEffect(() => {
    const channel = supabase
      .channel("teaching_cases_feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cases" },
        () => {
          void refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, refresh]);

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
      <div className="flex flex-wrap gap-3">
        <Button size="sm" type="button" asChild variant="default">
          <Link href="/cases/new">Новый кейс</Link>
        </Button>
        <Button size="sm" type="button" onClick={() => void seedDemoCase()}>
          Добавить демо в галерею
        </Button>
        <Button size="sm" variant="secondary" type="button" onClick={() => void refresh()}>
          Обновить
        </Button>
      </div>

      {cases.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Кейсов пока нет</CardTitle>
            <CardDescription>
              Примените миграции из{" "}
              <code className="rounded bg-slate-100 px-1 font-mono text-xs">supabase/migrations</code>, затем создайте
              кейс или нажмите «Добавить демо».
            </CardDescription>
          </CardHeader>
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
                    <Badge variant="outline">{c.status}</Badge>
                    {c.user_id === userId ? <Badge variant="outline">мой кейс</Badge> : null}
                    <span className="text-xs text-slate-400">{new Date(c.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant={liked[c.id] ? "default" : "secondary"} type="button" onClick={() => void toggleLike(c.id)}>
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
                  <Link href={`/cases/${c.id}`}>Открыть карточку →</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
