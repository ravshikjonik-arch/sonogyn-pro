"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, GraduationCap, RussianRuble, Users } from "lucide-react";

import { SalesChart } from "@/components/author/SalesChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AuthorDashboardStats } from "@/lib/courses/types";

export function AuthorDashboardClient() {
  const [stats, setStats] = useState<AuthorDashboardStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/author/dashboard", { credentials: "same-origin" });
        const body = (await res.json()) as { ok?: boolean; stats?: AuthorDashboardStats; error?: string };
        if (!res.ok || !body.ok || !body.stats) {
          setError(body.error ?? "Не удалось загрузить дашборд.");
          return;
        }
        setStats(body.stats);
      } catch {
        setError("Ошибка сети.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <p className="text-sm text-[var(--clinical-foreground-muted)]">Загрузка дашборда…</p>;
  }

  if (error || !stats) {
    return <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
  }

  const cards = [
    { icon: Users, label: "Студентов", value: stats.studentCount.toLocaleString("ru-RU") },
    { icon: RussianRuble, label: "Доход (всего)", value: `${stats.totalRevenueRub.toLocaleString("ru-RU")} ₽` },
    { icon: BookOpen, label: "Курсов", value: String(stats.courseCount) },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--clinical-primary-deep)]">Автор</p>
          <h1 className="text-3xl font-black tracking-tight">Дашборд автора</h1>
        </div>
        <Button asChild>
          <Link href="/author/courses">Мои курсы</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>{c.label}</CardDescription>
                <Icon className="h-5 w-5 text-[var(--clinical-primary)]" />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl">{c.value}</CardTitle>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Продажи за 30 дней</CardTitle>
          <CardDescription>
            Выручка за период: {stats.revenueRub.toLocaleString("ru-RU")} ₽ · всего:{" "}
            {stats.totalRevenueRub.toLocaleString("ru-RU")} ₽
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SalesChart data={stats.salesLast30Days} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Последние записи на офлайн-лекции
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentOfflineRegistrations.length === 0 ? (
            <p className="text-sm text-[var(--clinical-foreground-muted)]">Пока нет записей.</p>
          ) : (
            <ul className="divide-y divide-[var(--clinical-border)]">
              {stats.recentOfflineRegistrations.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div>
                    <p className="font-medium">{r.lesson_title ?? "Лекция"}</p>
                    <p className="text-xs text-[var(--clinical-foreground-muted)]">
                      {new Date(r.registered_at).toLocaleString("ru-RU")} · {r.status}
                    </p>
                  </div>
                  <Link href={`/author/courses/${r.course_id}/students`} className="text-[var(--clinical-primary-deep)] hover:underline">
                    Студенты
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
