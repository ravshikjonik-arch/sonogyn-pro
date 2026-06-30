import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PublicAuthorInfo } from "@/lib/courses/public-queries";
import { sanitizeCourseHtml } from "@/lib/security/sanitize-course-html";

export type CourseCardData = {
  id: string;
  title: string;
  description_html: string;
  price_rub: number;
  enrolled: boolean;
  coverUrl?: string | null;
  author?: PublicAuthorInfo | null;
};

type CourseCardProps = {
  course: CourseCardData;
  enrolling?: boolean;
  onEnroll?: () => void;
};

export function CourseCard({ course, enrolling, onEnroll }: CourseCardProps) {
  return (
    <Card className="sonogyn-tile-hover flex h-full flex-col overflow-hidden">
      {course.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={course.coverUrl} alt="" className="h-40 w-full object-cover" />
      ) : (
        <div className="flex h-40 items-center justify-center bg-gradient-to-br from-[var(--clinical-primary-muted)] to-slate-100 text-sm text-slate-500">
          Курс
        </div>
      )}
      <CardHeader>
        <CardTitle className="flex items-start justify-between gap-2 text-lg">
          <Link href={`/tools/refs/courses/${course.id}`} className="hover:underline">
            {course.title}
          </Link>
          {course.enrolled ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
              <Check className="h-3 w-3" />
              Записан
            </span>
          ) : null}
        </CardTitle>
        <CardDescription>
          {course.author?.fullName ? `${course.author.fullName} · ` : ""}
          {course.price_rub > 0
            ? `${course.price_rub.toLocaleString("ru-RU")} ₽`
            : "Бесплатно"}
        </CardDescription>
      </CardHeader>
      <CardContent
        className="prose prose-sm max-w-none flex-1 text-[var(--clinical-foreground-muted)] dark:prose-invert"
        dangerouslySetInnerHTML={{
          __html: sanitizeCourseHtml(course.description_html?.slice(0, 280) || "<p>Описание скоро.</p>"),
        }}
      />
      <CardContent className="flex gap-2 pt-0">
        <Button variant="secondary" className="flex-1" asChild>
          <Link href={`/tools/refs/courses/${course.id}`}>Подробнее</Link>
        </Button>
        {!course.enrolled && onEnroll ? (
          <Button className="flex-1" disabled={enrolling} onClick={onEnroll}>
            {course.price_rub > 0 ? "Купить" : "Записаться"}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
