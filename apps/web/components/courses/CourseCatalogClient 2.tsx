"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { CareerPathWidget } from "@/components/career/CareerPathWidget";
import { CourseCard, type CourseCardData } from "@/components/courses/CourseCard";
import { Card, CardContent } from "@/components/ui/card";
import type { CareerProgress } from "@/lib/career/ladder";
import type { PublicAuthorInfo } from "@/lib/courses/public-queries";

type CourseItem = CourseCardData & { author: PublicAuthorInfo };

export function CourseCatalogClient() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [progress, setProgress] = useState<CareerProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [coursesRes, careerRes] = await Promise.all([
      fetch("/api/courses", { credentials: "same-origin" }),
      fetch("/api/career/progress", { credentials: "same-origin" }),
    ]);
    const coursesBody = (await coursesRes.json()) as { courses?: CourseItem[] };
    const careerBody = (await careerRes.json()) as { progress?: CareerProgress };
    setCourses(coursesBody.courses ?? []);
    setProgress(careerBody.progress ?? null);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    const params = new URLSearchParams(window.location.search);
    if (params.get("enrolled")) {
      toast.success("Оплата прошла — вы ординатор!", {
        description: "Завершите профиль врача для статуса «Врач» (75%).",
        action: { label: "Профиль", onClick: () => { window.location.href = "/profile"; } },
        duration: 12000,
      });
      window.history.replaceState({}, "", "/library/courses");
    }
  }, []);

  async function enroll(course: CourseItem) {
    setEnrollingId(course.id);
    try {
      const res = await fetch(`/api/courses/${course.id}/enroll`, {
        method: "POST",
        credentials: "same-origin",
      });
      const body = (await res.json()) as {
        ok?: boolean;
        error?: string;
        requiresPayment?: boolean;
        confirmationUrl?: string;
        career?: { milestone?: string; currentStage?: string };
      };

      if (!res.ok || !body.ok) {
        toast.error(body.error ?? "Не удалось записаться");
        return;
      }

      if (body.requiresPayment && body.confirmationUrl) {
        toast.message("Переход к оплате", { description: course.title });
        window.location.href = body.confirmationUrl;
        return;
      }

      if (body.career?.milestone === "intern") {
        toast.success("Вы ординатор!", {
          description: "Завершите профиль врача — станете «Врачом» (75%). Письмо на email.",
          action: { label: "Профиль", onClick: () => { window.location.href = "/profile"; } },
          duration: 12000,
        });
      } else {
        toast.success("Запись на курс оформлена", { description: course.title });
      }

      await load();
    } finally {
      setEnrollingId(null);
    }
  }

  return (
    <div className="space-y-8">
      {progress && progress.currentStage !== "pro" ? (
        <CareerPathWidget progress={progress} variant="compact" />
      ) : null}

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-[var(--clinical-foreground-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Загрузка каталога…
        </p>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-[var(--clinical-foreground-muted)]">
            Пока нет опубликованных курсов. Авторы готовят программы — загляните позже.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              enrolling={enrollingId === course.id}
              onEnroll={course.enrolled ? undefined : () => void enroll(course)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
