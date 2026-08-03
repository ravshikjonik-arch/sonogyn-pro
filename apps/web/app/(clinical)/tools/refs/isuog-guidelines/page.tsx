import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CLINICAL_GUIDELINES, type ClinicalGuideline } from "@repo/clinical-guidelines";

const ISUOG_GUIDELINES = CLINICAL_GUIDELINES.filter(
  (g: ClinicalGuideline) => g.shelf === "international" && g.issuer === "isuo",
);

const INTERNAL_LINKS = [
  { href: "/tools/refs/exam-checklists", label: "Чек-листы AIUM/ISUOG" },
  { href: "/tools/refs/fetal-biometry-formulas", label: "Формулы биометрии" },
  { href: "/tools/refs/ultrasound-safety", label: "Безопасность УЗИ" },
];

export default function IsuogGuidelinesHubPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 lg:px-8">
      <header className="space-y-3">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/tools/refs">← Библиотека</Link>
        </Button>
        <Badge variant="outline">ISUOG · updated 2024–2025</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">ISUOG Guidelines Hub</h1>
        <p className="max-w-3xl text-sm text-[var(--clinical-foreground-muted)]">
          Ключевые международные гайдлайны ISUOG с ссылками на инструменты SonoGyn Pro. Дополняют КР МЗ РФ.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {INTERNAL_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="text-sm font-medium text-[var(--clinical-primary)] underline">
            {l.label}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {ISUOG_GUIDELINES.map((g) => (
          <Card key={g.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{g.title}</CardTitle>
                <Badge variant="outline">{g.year}</Badge>
              </div>
              <CardDescription>{g.summary}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {g.sections?.map((sec) => (
                <div key={sec.title}>
                  <p className="text-xs font-semibold">{sec.title}</p>
                  <ul className="list-disc pl-4 text-xs text-[var(--clinical-foreground-muted)]">
                    {sec.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
              {g.officialUrl && (
                <a
                  href={g.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-[var(--clinical-primary)] underline"
                >
                  ISUOG.org <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-[var(--clinical-foreground-muted)]">
        Полный каталог:{" "}
        <Link href="/tools/refs/guidelines" className="underline">
          Клинические рекомендации → полка «Международные»
        </Link>
      </p>
    </div>
  );
}
