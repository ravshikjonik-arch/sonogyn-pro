"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";

import { NotifyStudentsPanel } from "@/components/author/NotifyStudentsPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StudentRow } from "@/lib/courses/types";

type StudentsPageClientProps = {
  courseId: string;
};

export function StudentsPageClient({ courseId }: StudentsPageClientProps) {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/author/courses/${courseId}/students`, { credentials: "same-origin" });
      const body = (await res.json()) as { ok?: boolean; students?: StudentRow[]; error?: string };
      if (!res.ok || !body.ok) {
        setError(body.error ?? "Ошибка загрузки");
        setLoading(false);
        return;
      }
      setStudents(body.students ?? []);
      setLoading(false);
    })();
  }, [courseId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--clinical-primary-deep)]">Студенты</p>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Прогресс студентов</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild size="sm">
            <Link href={`/author/courses/${courseId}`}>← Редактор</Link>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <a href={`/api/author/courses/${courseId}/students/export`}>
              <Download className="mr-2 h-4 w-4" />
              CSV
            </a>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Таблица ({students.length})</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {loading ? <p className="text-sm text-[var(--clinical-foreground-muted)]">Загрузка…</p> : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {!loading && !error ? (
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--clinical-border)] text-xs uppercase text-[var(--clinical-foreground-muted)]">
                    <th className="py-2 pr-4">Студент</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Телефон</th>
                    <th className="py-2 pr-4">Прогресс</th>
                    <th className="py-2">Запись</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.userId} className="border-b border-[var(--clinical-border)]">
                      <td className="py-3 pr-4 font-medium">{s.fullName ?? "—"}</td>
                      <td className="py-3 pr-4 text-[var(--clinical-foreground-muted)]">{s.email ?? "—"}</td>
                      <td className="py-3 pr-4 text-[var(--clinical-foreground-muted)]">{s.phone ?? "—"}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                            <div
                              className="h-full bg-[var(--clinical-primary)]"
                              style={{ width: `${s.progressPercent}%` }}
                            />
                          </div>
                          <span>{s.progressPercent}%</span>
                        </div>
                      </td>
                      <td className="py-3 text-xs text-[var(--clinical-foreground-muted)]">
                        {new Date(s.enrolledAt).toLocaleDateString("ru-RU")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </CardContent>
        </Card>
        <NotifyStudentsPanel courseId={courseId} />
      </div>
    </div>
  );
}
