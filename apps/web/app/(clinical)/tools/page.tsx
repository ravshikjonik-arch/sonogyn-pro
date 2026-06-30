import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TOOLS_HOME_DOMAINS } from "@/lib/nav/domain-hubs";

/** Domain-first tools hub — акушерство / гинекология / O-RADS / калькуляторы / помощник. */
export default function ToolsHubPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-8 pb-24 lg:px-6">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--clinical-foreground-muted)]">
          Инструменты
        </p>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Кабинет врача</h1>
        <p className="max-w-2xl text-sm text-[var(--clinical-foreground-muted)]">
          Акушерство и гинекология — отдельно. Калькуляторы — отдельной строкой. O-RADS и эхограммы — в одном
          хабе. Помощник и Evidence AI — всегда под рукой.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {TOOLS_HOME_DOMAINS.map((domain) => (
          <Card key={domain.href} className="sonogyn-tile-hover overflow-hidden">
            <div className={`h-1.5 bg-gradient-to-r ${domain.accent}`} />
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{domain.title}</CardTitle>
              <CardDescription className="leading-relaxed">{domain.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="gap-2">
                <Link href={domain.href}>
                  Открыть
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="rounded-2xl border border-dashed border-[var(--clinical-border)] p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
          Дополнительно
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/tools/mapping">Anatomical mapping</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/tools/refs">Справочники и курсы</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/cases">Чат врачей</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
