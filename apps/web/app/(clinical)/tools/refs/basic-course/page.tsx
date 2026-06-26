import { Suspense } from "react";

import { BasicCourseWidget } from "@/components/education/BasicCourseWidget";

type Props = { searchParams: Promise<{ lecture?: string }> };

export default async function BasicCoursePage({ searchParams }: Props) {
  const { lecture } = await searchParams;

  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <Suspense fallback={<p className="text-sm text-[var(--clinical-foreground-muted)]">Загрузка курса…</p>}>
          <BasicCourseWidget variant="full" initialLectureId={lecture} />
        </Suspense>
      </div>
    </div>
  );
}
