import type { Nosology, NosologyBlock } from "@repo/nosology";
import { AlertTriangle, ClipboardCheck, FileText, HeartHandshake, Route, ScanSearch } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const MAX_ITEMS = 3;

export function ShortGuidelineCard({ nosology }: { nosology: Nosology }) {
  const short = nosology.shortGuideline;
  const diagnostics = short?.ultrasound?.length ? short.ultrasound : pickItems(nosology.diagnostics);
  const examination = short?.workup?.length ? short.workup : pickItems(nosology.examinationScheme);
  const treatment = short?.management?.length ? short.management : pickItems(nosology.treatment);
  const redFlags = short?.redFlags?.length ? short.redFlags : pickRedFlags(nosology);
  const patientInfo = short?.patientInfo?.length ? short.patientInfo : buildPatientItems(nosology);
  const sources = short?.sources?.length ? short.sources : pickItems(nosology.guidelines, 4);
  const summary = short?.summary?.trim() || nosology.description;

  return (
    <Card className="border-[var(--clinical-primary)]/25 bg-[var(--clinical-primary-muted)]/20 shadow-none">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default">КР-карточка</Badge>
          {nosology.icd10 ? <Badge variant="outline">МКБ-10: {nosology.icd10}</Badge> : null}
          <Badge variant="secondary">справочно · не диагноз</Badge>
        </div>
        <div>
          <CardTitle className="text-xl">Суть за 30 секунд</CardTitle>
          <CardDescription className="mt-2 max-w-4xl leading-relaxed">
            {summary} Используйте карточку как быстрый клинический маршрут; финальную интерпретацию, диагноз и
            тактику определяет врач с учётом пациентки и первоисточников.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <GuidelinePanel
            icon={ClipboardCheck}
            title="Обследование"
            items={examination}
            empty="Откройте вкладку «Обследование» для полного маршрута."
          />
          <GuidelinePanel
            icon={ScanSearch}
            title="УЗИ и диагностика"
            items={diagnostics}
            empty="Откройте вкладку «Диагностика» для УЗ-критериев."
          />
          <GuidelinePanel
            icon={Route}
            title="Тактика"
            items={treatment}
            empty="Откройте вкладку «Лечение» для тактики и маршрутизации."
          />
          <GuidelinePanel
            icon={AlertTriangle}
            title="Red flags"
            items={redFlags}
            empty="Красные флаги не выделены отдельно; проверьте полный текст нозологии."
            tone="warning"
          />
          <GuidelinePanel
            icon={HeartHandshake}
            title="Пациентке"
            items={patientInfo}
            empty="Поясните, что материал справочный и не заменяет очную консультацию."
          />
          <GuidelinePanel
            icon={FileText}
            title="Источники"
            items={sources}
            empty="Источники будут добавлены после клинической валидации."
          />
        </div>
      </CardContent>
    </Card>
  );
}

function GuidelinePanel({
  empty,
  icon: Icon,
  items,
  title,
  tone = "default",
}: {
  empty: string;
  icon: typeof ClipboardCheck;
  items: string[];
  title: string;
  tone?: "default" | "warning";
}) {
  const borderClass =
    tone === "warning"
      ? "border-amber-300/70 bg-amber-50/80 dark:bg-amber-950/20"
      : "border-[var(--clinical-border)] bg-[var(--clinical-card)]";

  return (
    <section className={`rounded-xl border ${borderClass} p-4`}>
      <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--clinical-foreground)]">
        <Icon className="h-4 w-4 text-[var(--clinical-primary)]" />
        {title}
      </h3>
      {items.length ? (
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--clinical-primary)]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">{empty}</p>
      )}
    </section>
  );
}

function pickItems(block: NosologyBlock, limit = MAX_ITEMS): string[] {
  const out: string[] = [];
  if (block.intro) out.push(block.intro);
  for (const item of block.highlights ?? []) out.push(`${item.title}: ${item.body}`);
  for (const item of block.checklist ?? []) out.push(item);
  for (const item of block.bullets ?? []) out.push(item);
  return unique(out).slice(0, limit);
}

function pickRedFlags(nosology: Nosology): string[] {
  const blocks = [nosology.examinationScheme, nosology.diagnostics, nosology.treatment, nosology.guidelines];
  const candidates = blocks.flatMap((block) => [
    ...(block.highlights ?? []).map((h) => `${h.title}: ${h.body}`),
    ...(block.bullets ?? []),
    ...(block.checklist ?? []),
  ]);
  return unique(candidates.filter((item) => /красн|сроч|онко|сарком|гипокс|кровотеч|экстр|red flag/i.test(item))).slice(
    0,
    MAX_ITEMS,
  );
}

function buildPatientItems(nosology: Nosology): string[] {
  const items = [
    `Объяснить пациентке рабочую находку простым языком: ${nosology.diagnosisLine}.`,
    "Уточнить, что УЗИ-заключение является частью клинической оценки и не равно окончательному диагнозу.",
    "Дать понятный следующий шаг: наблюдение, дообследование или консультация профильного специалиста по показаниям.",
  ];
  return items;
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}
