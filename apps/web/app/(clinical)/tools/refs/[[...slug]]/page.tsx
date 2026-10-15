import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  Calculator,
  ClipboardList,
  Download,
  FileCheck2,
  GraduationCap,
  ListChecks,
  Search,
  Sparkles,
} from "lucide-react";

import { TelegramChannelLink } from "@/components/clinical/TelegramChannelLink";
import { EducationLibraryCatalog } from "@/components/education/EducationLibraryCatalog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const reclinInspiredShelves = [
  {
    title: "Сокращенные КР и приказы",
    description: "КР МЗ РФ, приказы, ISUOG и рабочие полки без длинного листания PDF.",
    href: "/tools/refs/guidelines",
    icon: FileCheck2,
    status: "Готово",
  },
  {
    title: "Материалы для практики",
    description: "Нормы, пациентские памятки, безопасность УЗИ и быстрые справочные разделы.",
    href: "/tools/refs/medical-knowledge",
    icon: ClipboardList,
    status: "Готово",
  },
  {
    title: "Гайды и методички",
    description: "O-RADS, IOTA, шейка матки, fetal anatomy, допплер и тематические учебные модули.",
    href: "/tools/refs/orads-guide",
    icon: BookOpen,
    status: "Расширяем",
  },
  {
    title: "Калькуляторы",
    description: "Акушерство, гинекология, RADS, прием и быстрые расчеты в одном маршруте.",
    href: "/tools/calc",
    icon: Calculator,
    status: "Готово",
  },
  {
    title: "Шаблоны осмотров и протоколов",
    description: "Структурированные заключения, PDF, протоколы придатков, щитовидной железы и акушерства.",
    href: "/reports",
    icon: ListChecks,
    status: "Готово",
  },
  {
    title: "Курсы и повторение",
    description: "Базовый курс, вебинары, CME-трекер, чеклисты и учебные кейсы.",
    href: "/tools/refs/courses",
    icon: GraduationCap,
    status: "Готово",
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
    <div className="px-4 py-8 pb-24 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-10">
        <header className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Библиотека</Badge>
              <Badge variant="secondary">КР · практика · гайды · курсы</Badge>
            </div>
            <div className="space-y-3">
              <h1 className="max-w-4xl text-3xl font-black tracking-tight text-[var(--clinical-foreground)] sm:text-4xl">
                Карманный клинический навигатор SonoGyn
              </h1>
              <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
                Быстрый доступ к сокращенным клиническим маршрутам, практическим материалам, калькуляторам,
                шаблонам протоколов и обучению. Контент строится на КР, гайдлайнах и авторской экспертизе SonoGyn;
                подсказки являются справочным материалом и не заменяют клиническое решение врача.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {clinicalShortcuts.map((item) => (
                <Button key={item.href} variant="secondary" size="sm" asChild>
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              ))}
            </div>
          </div>

          <Card className="border-[var(--clinical-primary)]/25 bg-[var(--clinical-primary-muted)]/25 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Search className="h-4 w-4" />
                Как пользоваться на приеме
              </CardTitle>
              <CardDescription className="leading-relaxed">
                Сначала найдите нозологию или инструмент, затем откройте алгоритм, калькулятор или шаблон. Для
                спорного вопроса переходите в Evidence AI.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild>
                <Link href="/tools/refs/evidence-assistant">
                  Спросить Evidence AI
                  <Sparkles className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reclinInspiredShelves.map((shelf) => {
            const Icon = shelf.icon;
            return (
              <Card key={shelf.href} className="flex flex-col border-[var(--clinical-border)] shadow-none">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="rounded-lg bg-[var(--clinical-muted)] p-2 text-[var(--clinical-primary-deep)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant={shelf.status === "Готово" ? "success" : "warning"}>{shelf.status}</Badge>
                  </div>
                  <CardTitle className="text-base">{shelf.title}</CardTitle>
                  <CardDescription className="leading-relaxed">{shelf.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button variant="secondary" className="w-full" asChild>
                    <Link href={shelf.href}>
                      Открыть
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="border-dashed shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bookmark className="h-4 w-4" />
                Что добавим следующим слоем
              </CardTitle>
              <CardDescription className="leading-relaxed">
                Reclin-сценарий в SonoGyn лучше развивать не шириной всех специальностей, а глубиной УЗИ/АГ.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 text-sm text-[var(--clinical-foreground-muted)] sm:grid-cols-2">
                <p>Избранное и недавно открытые материалы для быстрого возвращения.</p>
                <p>Офлайн-пакеты в mobile: КР, гайды, калькуляторы и чеклисты без сети.</p>
                <p>Редактор коротких авторских гайдов по единому шаблону: суть, алгоритм, red flags.</p>
                <p>Печать памяток и рекомендаций пациенту из карточки приема.</p>
              </div>
            </CardContent>
          </Card>

          <TelegramChannelLink />
        </section>

        <section className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--clinical-foreground)]">Вся библиотека SonoGyn</h2>
              <p className="mt-1 text-sm text-[var(--clinical-foreground-muted)]">
                Поиск по существующим полкам: атласы, курсы, КР, нормы, алгоритмы и учебные кейсы.
              </p>
            </div>
            <Badge variant="outline">
              <Download className="mr-1 h-3.5 w-3.5" />
              offline-ready roadmap
            </Badge>
          </div>
          <EducationLibraryCatalog />
        </section>
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
