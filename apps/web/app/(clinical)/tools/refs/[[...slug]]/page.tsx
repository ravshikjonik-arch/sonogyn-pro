import { notFound } from "next/navigation";

import { TelegramChannelLink } from "@/components/clinical/TelegramChannelLink";
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
            Справочники и инструменты
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
            Справочники, атласы и калькуляторы. Поиск и быстрый переход к инструменту.
          </p>
        </header>

        <TelegramChannelLink className="max-w-xl" />

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
