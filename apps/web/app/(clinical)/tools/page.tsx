import Link from "next/link";
import { Calculator, Map, BookOpen, Stethoscope } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** P1 hub — entry to calc / mapping / refs / adjunct zones. */
export default function ToolsHubPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 pb-24 lg:px-6">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--clinical-foreground-muted)]">
          Инструменты
        </p>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Клинический арсенал</h1>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          Калькуляторы по гайдлайнам, анатомический mapping и справочники — вокруг кейса, не вместо него.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="h-5 w-5" />
              Калькуляторы
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-[var(--clinical-foreground-muted)]">
            <p>O-RADS, BI-RADS, срок беременности, POP-Q, кольпоскопия…</p>
            <Button asChild size="sm">
              <Link href="/tools/calc">Открыть</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Map className="h-5 w-5" />
              Anatomical Mapping
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-[var(--clinical-foreground-muted)]">
            <p>FIGO, O-RADS/IOTA, ENZIAN — ввод данных в протокол.</p>
            <Button asChild size="sm" variant="secondary">
              <Link href="/tools/mapping">Открыть</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-5 w-5" />
              Справочники
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-[var(--clinical-foreground-muted)]">
            <p>КР, атласы, курсы — без отдельной зоны Academy.</p>
            <Button asChild size="sm" variant="secondary">
              <Link href="/tools/refs">Открыть</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Stethoscope className="h-5 w-5" />
              Adjunct · TI-RADS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-[var(--clinical-foreground-muted)]">
            <p>Щитовидная железа — отдельный adjunct-модуль (R4).</p>
            <Button asChild size="sm" variant="secondary">
              <Link href="/tools/adjunct/ti-rads">Открыть</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
