"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ModuleAccordion } from "@/components/courses/ModuleAccordion";
import { ProgressBar } from "@/components/courses/ProgressBar";
import { Button } from "@/components/ui/button";
import type { PublicAuthorInfo } from "@/lib/courses/public-queries";

type CourseDetail = {
  id: string;
  title: string;
  description_html: string;
  price_rub: number;
  coverUrl: string | null;
  lessonCount: number;
  author: PublicAuthorInfo;
  modules: {
    id: string;
    title: string;
    sort_order: number;
    lessons: {
      id: string;
      title: string;
      lesson_type: "video" | "offline";
      duration_minutes?: number | null;
      is_free_preview?: boolean;
      sort_order?: number;
      locked?: boolean;
    }[];
  }[];
};

type CourseDetailClientProps = {
  courseId: string;
};

export function CourseDetailClient({ courseId }: CourseDetailClientProps) {
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/courses/${courseId}`, { credentials: "same-origin" });
    const body = (await res.json()) as {
      ok?: boolean;
      course?: CourseDetail;
      enrolled?: boolean;
      progressPercent?: number;
      error?: string;
    };
    if (!res.ok || !body.course) {
      toast.error(body.error ?? "Курс не найден");
      setLoading(false);
      return;
    }
    setCourse(body.course);
    setEnrolled(Boolean(body.enrolled));
    setProgressPercent(body.progressPercent ?? 0);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [courseId]);

  async function enroll() {
    if (!course) return;
    setEnrolling(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
        credentials: "same-origin",
      });
      const body = (await res.json()) as {
        ok?: boolean;
        requiresPayment?: boolean;
        confirmationUrl?: string;
        error?: string;
      };
      if (!res.ok || !body.ok) {
        toast.error(body.error ?? "Не удалось записаться");
        return;
      }
      if (body.requiresPayment && body.confirmationUrl) {
        window.location.href = body.confirmationUrl;
        return;
      }
      toast.success("Вы записаны на курс");
      await load();
    } finally {
      setEnrolling(false);
    }
  }

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Загрузка…
      </p>
    );
  }

  if (!course) return null;

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {course.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={course.coverUrl} alt="" className="max-h-72 w-full rounded-2xl object-cover" />
          ) : null}
          <h1 className="text-3xl font-semibold tracking-tight">{course.title}</h1>
          <div
            className="prose max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: course.description_html || "<p></p>" }}
          />
        </div>
        <aside className="space-y-4 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-5">
          <div>
            <p className="text-sm text-slate-500">Автор</p>
            <p className="font-semibold">{course.author.fullName ?? "Преподаватель"}</p>
            {course.author.bio ? <p className="mt-2 text-sm text-slate-600">{course.author.bio}</p> : null}
          </div>
          <p className="text-2xl font-bold">
            {course.price_rub > 0 ? `${course.price_rub.toLocaleString("ru-RU")} ₽` : "Бесплатно"}
          </p>
          <p className="text-sm text-slate-500">{course.lessonCount} уроков</p>
          {enrolled ? (
            <>
              <ProgressBar value={progressPercent} label="Ваш прогресс" />
              <Button asChild className="w-full">
                <Link href={`/library/my-courses`}>Мои курсы</Link>
              </Button>
            </>
          ) : (
            <Button className="w-full" disabled={enrolling} onClick={() => void enroll()}>
              {enrolling ? "…" : course.price_rub > 0 ? "Купить курс" : "Начать бесплатно"}
            </Button>
          )}
        </aside>
      </div>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Программа курса</h2>
        <ModuleAccordion courseId={courseId} modules={course.modules} progressPercent={progressPercent} />
      </section>
    </div>
  );
}
