import Link from "next/link";

import { TelegramChannelLink } from "@/components/clinical/TelegramChannelLink";
import { BasicCourseWidget } from "@/components/education/BasicCourseWidget";
import { EducationLibraryCatalog } from "@/components/education/EducationLibraryCatalog";
import { Badge } from "@/components/ui/badge";

export default function LibraryPage() {
  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-10">
        <header className="space-y-2">
          <Badge variant="outline">Библиотека</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--clinical-foreground)]">
            Учебные материалы
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
            Всё по полкам: курсы ISUOG, справочники, атласы и калькуляторы. Поиск и быстрый переход к инструменту.
          </p>
          <Link href="/library/basic-course?tab=program" className="text-sm font-medium text-[var(--clinical-primary)] underline">
            ISUOG Basic Training → программа · лекция · практика
          </Link>
        </header>

        <TelegramChannelLink className="max-w-xl" />

        <BasicCourseWidget variant="compact" className="max-w-xl" />

        <EducationLibraryCatalog />
      </div>
    </div>
  );
}
