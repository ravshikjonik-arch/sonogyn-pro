import Link from "next/link";

import { CourseCatalogClient } from "@/components/courses/CourseCatalogClient";
import { Badge } from "@/components/ui/badge";

export default function RefsCoursesPage() {
  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-2">
          <Badge variant="outline">Шаг 2 · Ординатор</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--clinical-foreground)]">
            Курсы авторов
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
            Запись на курс открывает статус «Ординатор». После заполнения профиля врача — «Врач» (75%) и
            письмо с шагом PRO.
          </p>
          <Link href="/tools/refs" className="text-sm font-medium text-[var(--clinical-primary)] underline">
            ← Библиотека
          </Link>
          <Link href="/tools/refs/my-courses" className="ml-4 text-sm font-medium text-[var(--clinical-primary)] underline">
            Мои курсы
          </Link>
        </header>
        <CourseCatalogClient />
      </div>
    </div>
  );
}
