"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

import { CalcChip, CalcStepCard } from "@/components/calculators/shared/calc-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CANCER_RISK_DISCLAIMER,
  evaluateBreastRiskEducation,
  evaluateCervicalCancerRisk,
  evaluateOvarianCancerRisk,
} from "@repo/medical-calculations";

function BoolChip({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return <CalcChip label={value ? `✓ ${label}` : label} selected={value} onClick={() => onChange(!value)} />;
}

export function BreastRiskCalculator() {
  const [age, setAge] = useState("45");
  const [menarcheBefore12, setMenarcheBefore12] = useState(false);
  const [firstBirthAfter30, setFirstBirthAfter30] = useState(false);
  const [firstDegree, setFirstDegree] = useState(false);
  const [priorBiopsy, setPriorBiopsy] = useState(false);

  const result = useMemo(() => {
    const a = Number.parseInt(age, 10);
    if (!Number.isFinite(a)) return null;
    return evaluateBreastRiskEducation({
      age: a,
      menarcheBefore12,
      firstBirthAfter30OrNulliparous: firstBirthAfter30,
      firstDegreeBcOrOvary: firstDegree,
      priorBreastBiopsyBenign: priorBiopsy,
    });
  }, [age, menarcheBefore12, firstBirthAfter30, firstDegree, priorBiopsy]);

  return (
    <RiskShell title="Риск рака молочной железы" badge="Образовательный чеклист">
      <CalcStepCard title="Факторы">
        <label className="block text-sm font-semibold">
          Возраст
          <Input className="mt-1 w-24" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
        </label>
        <div className="flex flex-wrap gap-2">
          <BoolChip label="Менархе &lt;12 лет" value={menarcheBefore12} onChange={setMenarcheBefore12} />
          <BoolChip label="1-е роды &gt;30 / nullipara" value={firstBirthAfter30} onChange={setFirstBirthAfter30} />
          <BoolChip label="РМЖ/яичник у родственницы I линии" value={firstDegree} onChange={setFirstDegree} />
          <BoolChip label="Доброкач. биопсия МЖ" value={priorBiopsy} onChange={setPriorBiopsy} />
        </div>
      </CalcStepCard>
      {result ? <RiskResult band={result.band} lines={result.text} /> : null}
    </RiskShell>
  );
}

export function CervicalCancerRiskCalculator() {
  const [age, setAge] = useState("35");
  const [hpv, setHpv] = useState(false);
  const [hsil, setHsil] = useState(false);
  const [smoking, setSmoking] = useState(false);
  const [immuno, setImmuno] = useState(false);
  const [overdue, setOverdue] = useState(false);

  const result = useMemo(() => {
    const a = Number.parseInt(age, 10);
    if (!Number.isFinite(a)) return null;
    return evaluateCervicalCancerRisk({
      age: a,
      hpv16or18Positive: hpv,
      hsilOrAtypicalGlandular: hsil,
      smoking,
      immunosuppression: immuno,
      overdueScreening: overdue,
    });
  }, [age, hpv, hsil, smoking, immuno, overdue]);

  return (
    <RiskShell title="Риск рака шейки матки" badge="Скрининг · стратификация">
      <CalcStepCard title="Факторы">
        <label className="block text-sm font-semibold">
          Возраст
          <Input className="mt-1 w-24" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
        </label>
        <div className="flex flex-wrap gap-2">
          <BoolChip label="ВПЧ 16/18+" value={hpv} onChange={setHpv} />
          <BoolChip label="HSIL / atypical glandular" value={hsil} onChange={setHsil} />
          <BoolChip label="Курение" value={smoking} onChange={setSmoking} />
          <BoolChip label="Иммунosuppression" value={immuno} onChange={setImmuno} />
          <BoolChip label="Просрочен скрининг" value={overdue} onChange={setOverdue} />
        </div>
      </CalcStepCard>
      {result ? <RiskResult band={result.level} lines={result.text} /> : null}
    </RiskShell>
  );
}

export function OvarianCancerRiskCalculator() {
  const [age, setAge] = useState("55");
  const [family, setFamily] = useState(false);
  const [brca, setBrca] = useState(false);
  const [postMeno, setPostMeno] = useState(true);
  const [ca125, setCa125] = useState(false);
  const [usSusp, setUsSusp] = useState(false);

  const result = useMemo(() => {
    const a = Number.parseInt(age, 10);
    if (!Number.isFinite(a)) return null;
    return evaluateOvarianCancerRisk({
      age: a,
      firstDegreeOvaryBreast: family,
      brcaKnown: brca,
      postmenopausal: postMeno,
      ca125Elevated: ca125,
      suspiciousUltrasound: usSusp,
    });
  }, [age, family, brca, postMeno, ca125, usSusp]);

  return (
    <RiskShell title="Риск рака яичников" badge="Эпидемиология + УЗИ">
      <CalcStepCard title="Факторы">
        <label className="block text-sm font-semibold">
          Возраст
          <Input className="mt-1 w-24" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
        </label>
        <div className="flex flex-wrap gap-2">
          <BoolChip label="Семейный анамнез РЯ/РМЖ" value={family} onChange={setFamily} />
          <BoolChip label="BRCA+" value={brca} onChange={setBrca} />
          <BoolChip label="Постменопауза" value={postMeno} onChange={setPostMeno} />
          <BoolChip label="CA-125 &gt;35" value={ca125} onChange={setCa125} />
          <BoolChip label="Подозрительное УЗИ яичника" value={usSusp} onChange={setUsSusp} />
        </div>
      </CalcStepCard>
      {result ? (
        <>
          <RiskResult band={result.level} lines={result.text} />
          {result.suggestOrads ? (
            <Button variant="secondary" asChild>
              <Link href="/tools/calc/rads/o-rads">O-RADS US →</Link>
            </Button>
          ) : null}
        </>
      ) : null}
    </RiskShell>
  );
}

function RiskShell({ title, badge, children }: { title: string; badge: string; children: ReactNode }) {
  return (
    <div className="space-y-6 px-4 py-10 lg:px-10">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/tools/calc/appointment">← Для приёма</Link>
      </Button>
      <header className="mx-auto max-w-3xl space-y-2">
        <Badge variant="outline">{badge}</Badge>
        <h1 className="text-3xl font-black tracking-tight">{title}</h1>
      </header>
      <div className="mx-auto max-w-3xl space-y-4">
        {children}
        <p className="text-center text-xs text-[var(--clinical-foreground-muted)]">{CANCER_RISK_DISCLAIMER}</p>
      </div>
    </div>
  );
}

function RiskResult({ band, lines }: { band: string; lines: string[] }) {
  return (
    <section className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/30 p-5">
      <p className="text-lg font-black capitalize">{band}</p>
      <ul className="mt-2 space-y-1 text-sm text-[var(--clinical-foreground-muted)]">
        {lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </section>
  );
}
