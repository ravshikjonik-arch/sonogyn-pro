import { notFound } from "next/navigation";
import Link from "next/link";

import { IosRowList } from "@/components/clinical/IosRowList";
import { EducationLibraryCatalog } from "@/components/education/EducationLibraryCatalog";

const reclinInspiredShelves = [
  {
    title: "Сокращенные КР и приказы",
    description: "КР МЗ РФ, приказы, ISUOG и рабочие полки без длинного листания PDF.",
    href: "/tools/refs/guidelines",
  },
  {
    title: "Материалы для практики",
    description: "Нормы, пациентские памятки, безопасность УЗИ и быстрые справочные разделы.",
    href: "/tools/refs/medical-knowledge",
  },
  {
    title: "Гайды и методички",
    description: "O-RADS, IOTA, шейка матки, анатомия плода и допплер.",
    href: "/tools/refs/orads-guide",
  },
  {
    title: "Калькуляторы",
    description: "Акушерство, гинекология, RADS и приём.",
    href: "/tools/calc",
  },
  {
    title: "Шаблоны осмотров и протоколов",
    description: "Заключения по придаткам, щитовидной железе и акушерству.",
    href: "/reports",
  },
  {
    title: "Курсы и повторение",
    description: "Базовый курс, вебинары, чеклисты и учебные кейсы.",
    href: "/tools/refs/courses",
  },
  {
    title: "Обучение · миома матки",
    description: "Шесть модулей, атлас, тест и расчёты описания.",
    href: "/tools/refs/myoma-education",
  },
] as const;

const clinicalShortcuts = [
  { label: "Гинекология", href: "/tools/gynecology" },
  { label: "Акушерство", href: "/tools/obstetrics" },
  { label: "Нозологии", href: "/tools/refs/nosologies" },
  { label: "Клин. нормы", href: "/tools/refs/norms" },
  { label: "Evidence AI", href: "/tools/refs/evidence-assistant" },
  { label: "Пациентские памятки", href: "/tools/refs/patient-information" },
] as const;

type Props = { params: Promise<{ slug?: string[] }> };

function RefsLibraryHubPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-6 pb-28 sm:max-w-xl">
      <header className="space-y-2">
        <Link href="/home" className="text-sm font-medium text-[var(--clinical-foreground-muted)]">
          ← Разделы
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--clinical-foreground)]">Справочник</h1>
        <p className="text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          Клинические рекомендации, практика, гайды и курсы. Справочная поддержка, не диагноз.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="px-1 text-sm font-semibold text-[var(--clinical-foreground-muted)]">Разделы</h2>
        <IosRowList
          rows={reclinInspiredShelves.map((shelf) => ({
            href: shelf.href,
            title: shelf.title,
            detail: shelf.description,
          }))}
        />
      </section>

      <section className="space-y-2">
        <h2 className="px-1 text-sm font-semibold text-[var(--clinical-foreground-muted)]">По специальностям</h2>
        <IosRowList
          rows={clinicalShortcuts.map((item) => ({
            href: item.href,
            title: item.label,
          }))}
        />
      </section>

      <section className="space-y-3">
        <h2 className="px-1 text-sm font-semibold text-[var(--clinical-foreground-muted)]">Вся библиотека</h2>
        <EducationLibraryCatalog />
      </section>
    </div>
  );
}

/** /tools/refs hub; unknown nested slugs → 404 */
export default async function ToolsRefsCatchAllPage({ params }: Props) {
  const { slug = [] } = await params;
  if (slug.length === 0) return <RefsLibraryHubPage />;
  notFound();
}
