"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { CalcChip, CalcStepCard } from "@/components/calculators/shared/calc-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CIN_FOLLOWUP_DISCLAIMER,
  cinFollowUpPlan,
  type CinHistology,
  type CinTreatment,
} from "@repo/medical-calculations";

const HIST_OPTS: { v: CinHistology; l: string }[] = [
  { v: "negative", l: "Норма / NILM" },
  { v: "hpv_positive_cytology_normal", l: "ВПЧ+ / цитология норма" },
  { v: "cin1", l: "CIN 1" },
  { v: "cin2", l: "CIN 2" },
  { v: "cin3", l: "CIN 3" },
  { v: "ais", l: "AIS" },
];

const TX_OPTS: { v: CinTreatment; l: string }[] = [
  { v: "none", l: "Без лечения" },
  { v: "excision", l: "Excision (LEEP/conization)" },
  { v: "ablation", l: "Ablation" },
];

export function CinFollowUpCalculator() {
  const [age, setAge] = useState("32");
  const [histology, setHistology] = useState<CinHistology>("cin2");
  const [treatment, setTreatment] = useState<CinTreatment>("excision");
  const [marginsPositive, setMarginsPositive] = useState(false);

  const result = useMemo(() => {
    const a = Number.parseInt(age, 10);
    if (!Number.isFinite(a)) return null;
    return cinFollowUpPlan({
      age: a,
      histology,
      treatment,
      marginsPositive,
      hpvTestAvailable: true,
    });
  }, [age, histology, treatment, marginsPositive]);

  return (
    <div className="space-y-6 px-4 py-10 lg:px-10">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/calculators/appointment">← Для приёма</Link>
      </Button>
      <header className="mx-auto max-w-3xl space-y-2">
        <Badge variant="outline">ASCCP 2019 · КР РФ</Badge>
        <h1 className="text-3xl font-black tracking-tight">Наблюдение после CIN / кольпоскопии</h1>
      </header>
      <div className="mx-auto max-w-3xl space-y-4">
        <CalcStepCard title="Исход">
          <label className="block text-sm font-semibold">
            Возраст
            <Input className="mt-1 w-24" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
          </label>
          <p className="text-xs font-bold text-[var(--clinical-foreground-muted)]">Гистология</p>
          <div className="flex flex-wrap gap-2">
            {HIST_OPTS.map((o) => (
              <CalcChip key={o.v} label={o.l} selected={histology === o.v} onClick={() => setHistology(o.v)} />
            ))}
          </div>
          <p className="text-xs font-bold text-[var(--clinical-foreground-muted)]">Лечение</p>
          <div className="flex flex-wrap gap-2">
            {TX_OPTS.map((o) => (
              <CalcChip key={o.v} label={o.l} selected={treatment === o.v} onClick={() => setTreatment(o.v)} />
            ))}
          </div>
          <CalcChip
            label={marginsPositive ? "✓ Положительный край resection" : "Положительный край resection"}
            selected={marginsPositive}
            onClick={() => setMarginsPositive((v) => !v)}
          />
        </CalcStepCard>
        {result ? (
          <section className="rounded-2xl border border-[var(--clinical-border)] p-5">
            <p className="text-xl font-black">Следующий визит через {result.intervalMonths} мес.</p>
            <p className="mt-2 text-sm font-semibold">Обследования:</p>
            <ul className="list-inside list-disc text-sm text-[var(--clinical-foreground-muted)]">
              {result.tests.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <ul className="mt-3 space-y-1 text-xs text-[var(--clinical-foreground-muted)]">
              {result.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/calculators/colposcopy">Кольпоскопия · Swede →</Link>
            </Button>
          </section>
        ) : null}
        <p className="text-center text-xs text-[var(--clinical-foreground-muted)]">{CIN_FOLLOWUP_DISCLAIMER}</p>
      </div>
    </div>
  );
}
