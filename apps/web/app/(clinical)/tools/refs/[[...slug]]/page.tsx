import Link from "next/link";
import { notFound } from "next/navigation";

import { TelegramChannelLink } from "@/components/clinical/TelegramChannelLink";
import { BasicCourseWidget } from "@/components/education/BasicCourseWidget";
import { EducationLibraryCatalog } from "@/components/education/EducationLibraryCatalog";
import { Badge } from "@/components/ui/badge";

type Props = { params: Promise<{ slug?: string[] }> };

function RefsLibraryHubPage() {
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
          <Link href="/tools/refs/basic-course?tab=program" className="text-sm font-medium text-[var(--clinical-primary)] underline">
            ISUOG Basic Training → программа · лекция · практика
          </Link>
          <Link href="/tools/refs/courses" className="block text-sm font-medium text-[var(--clinical-primary)] underline">
            Курсы авторов → шаг «Ординатор» на платформе
          </Link>
        </header>

        <TelegramChannelLink className="max-w-xl" />

        <BasicCourseWidget variant="compact" className="max-w-xl" />

        <EducationLibraryCatalog />
      </div>
    </div>
  );
}

/** /tools/refs hub; unknown nested slugs → 404 */
export default async function ToolsRefsCatchAllPage({ params }: Props) {
  const { slug = [] } = await params;
  if (slug.length === 0) return <RefsLibraryHubPage />;
  notFound();
}
