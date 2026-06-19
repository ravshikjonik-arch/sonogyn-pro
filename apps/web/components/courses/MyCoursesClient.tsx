"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { ProgressBar } from "@/components/courses/ProgressBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type EnrollmentRow = {
  enrollmentId: string;
  courseId: string;
  progressPercent: number;
  course: {
    id: string;
    title: string;
    coverUrl: string | null;
  } | null;
};

export function MyCoursesClient() {
  const [rows, setRows] = useState<EnrollmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/user/enrollments", { credentials: "same-origin" });
      const body = (await res.json()) as { enrollments?: EnrollmentRow[] };
      setRows(body.enrollments ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Загрузка…
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-slate-500">
          Вы ещё не записаны на курсы.{" "}
          <Link href="/library/courses" className="text-[var(--clinical-primary)] underline">
            Перейти в каталог
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {rows.map((row) => (
        <Card key={row.enrollmentId} className="overflow-hidden">
          {row.course?.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.course.coverUrl} alt="" className="h-36 w-full object-cover" />
          ) : null}
          <CardHeader>
            <CardTitle className="text-lg">{row.course?.title ?? "Курс"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProgressBar value={row.progressPercent} label="Прогресс" />
            <Button asChild className="w-full">
              <Link href={`/library/courses/${row.courseId}`}>Продолжить</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
