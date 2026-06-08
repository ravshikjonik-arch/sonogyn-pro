import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { CaseFeed } from "@/components/cases/case-feed";

export default function CasesPage() {
  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-2">
          <Badge variant="outline">Realtime · галерея</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Учебные кейсы УЗИ</h1>
          <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
            Лента строится из таблицы <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs">cases</code>{" "}
            (RLS: ваши черновики и опубликованные публичные материалы). Перед PHI включите все политики из{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs">supabase/migrations</code>.
          </p>
        </header>

        <Suspense fallback={<p className="text-sm text-slate-500">Загрузка кейсов…</p>}>
          <CaseFeed />
        </Suspense>
      </div>
    </div>
  );
}
