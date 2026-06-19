"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CourseRow } from "@/lib/courses/types";

export function CourseListClient() {
  const router = useRouter();
  const [courses, setCourses] = useState<Pick<CourseRow, "id" | "title" | "status" | "price_rub" | "updated_at">[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/author/courses", { credentials: "same-origin" });
    const body = (await res.json()) as { ok?: boolean; courses?: typeof courses; error?: string };
    if (!res.ok || !body.ok) {
      setError(body.error ?? "Ошибка загрузки");
      setLoading(false);
      return;
    }
    setCourses(body.courses ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function createCourse() {
    setCreating(true);
    setError("");
    const res = await fetch("/api/author/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ title: "Новый курс", description_html: "<p></p>" }),
    });
    const body = (await res.json()) as { ok?: boolean; course?: { id: string }; error?: string };
    setCreating(false);
    if (!res.ok || !body.ok || !body.course) {
      setError(typeof body.error === "string" ? body.error : "Не удалось создать курс");
      return;
    }
    router.push(`/author/courses/${body.course.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--clinical-primary-deep)]">Курсы</p>
          <h1 className="text-3xl font-black tracking-tight">Мои курсы</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/author">Дашборд</Link>
          </Button>
          <Button onClick={() => void createCourse()} disabled={creating}>
            <Plus className="mr-2 h-4 w-4" />
            {creating ? "Создание…" : "Новый курс"}
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading ? <p className="text-sm text-[var(--clinical-foreground-muted)]">Загрузка…</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        {courses.map((course) => (
          <Card key={course.id} className="sonogyn-tile-hover">
            <CardHeader>
              <CardTitle className="line-clamp-2">{course.title || "Без названия"}</CardTitle>
              <CardDescription>
                {course.status} · {course.price_rub.toLocaleString("ru-RU")} ₽ · обновлён{" "}
                {new Date(course.updated_at).toLocaleDateString("ru-RU")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href={`/author/courses/${course.id}`}>Редактор</Link>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <Link href={`/author/courses/${course.id}/students`}>Студенты</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
