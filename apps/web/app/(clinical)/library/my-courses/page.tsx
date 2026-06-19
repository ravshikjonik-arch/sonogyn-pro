import Link from "next/link";

import { MyCoursesClient } from "@/components/courses/MyCoursesClient";

export default function MyCoursesPage() {
  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Мои курсы</h1>
          <p className="text-sm text-[var(--clinical-foreground-muted)]">
            Прогресс по каждому курсу и быстрый доступ к урокам.
          </p>
          <Link href="/library/courses" className="text-sm text-[var(--clinical-primary)] underline">
            ← Каталог
          </Link>
        </header>
        <MyCoursesClient />
      </div>
    </div>
  );
}
