"use client";

import { useMemo, useState } from "react";

import {
  cerebroplacentalRatio,
  datingFromCrl,
  ntReference,
  type CprResult,
  type DatingCrlResult,
  type NtReferenceResult,
} from "@repo/medical-calculations";

/**
 * Хаб «Калькуляторы FMF» (изменение №7, этап 1).
 * Группа «Оценка / менеджмент»: 3 живых инструмента (dating, NT-референсы, CPR)
 * + 3 в плане этапа 2. Группа «Предикция риска»: этап 2–3.
 * Движки — по опубликованным источникам с атрибуцией (К1), учебные.
 */

const inputCls =
  "w-full rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-background)] px-3 py-2 text-sm text-[var(--clinical-foreground)] outline-none focus:border-[var(--clinical-primary)]";
const labelCls = "block text-xs font-semibold text-[var(--clinical-foreground-muted)] mb-1";
const cardCls = "rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-5";
const num = (s: string) => {
  const v = parseFloat(s.replace(",", "."));
  return Number.isFinite(v) ? v : undefined;
};

const ATTRIBUTION =
  "Движки по опубликованным источникам: Robinson & Fleming BJOG 1975 (LOINC 11914-9) · Wright et al. UOG 2008;31:376–83 (калибровка) · пороги CPR — общепринятые. Атрибуция обязательна. Учебные расчёты — не диагноз; решение за врачом.";

function ResultLine({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between border-b border-[var(--clinical-border)] py-1.5 text-xs">
      <span className="text-[var(--clinical-foreground-muted)]">{label}</span>
      <span className={strong ? "font-black text-[var(--clinical-foreground)]" : "font-semibold text-[var(--clinical-foreground)]"}>{value}</span>
    </div>
  );
}

function Badge({ tone, children }: { tone: "ok" | "s2"; children: React.ReactNode }) {
  const cls =
    tone === "ok"
      ? "border-[var(--clinical-success, #16a34a)]/50 text-[var(--clinical-success, #16a34a)] bg-[var(--clinical-success, #16a34a)]/10"
      : "border-[var(--clinical-warning, #d97706)]/50 text-[var(--clinical-warning, #d97706)] bg-[var(--clinical-warning, #d97706)]/10";
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${cls}`}>{children}</span>;
}

function DatingTool() {
  const [crl, setCrl] = useState("63");
  const r: DatingCrlResult | null = useMemo(() => (num(crl) != null ? datingFromCrl(num(crl)!) : null), [crl]);
  return (
    <div className={cardCls}>
      <h3 className="text-sm font-bold text-[var(--clinical-primary-deep)]">Pregnancy dating · CRL → срок <Badge tone="ok">ГОТОВО</Badge></h3>
      <label className={`${labelCls} mt-3`}>CRL, мм (5–84)</label>
      <input value={crl} onChange={(e) => setCrl(e.target.value)} inputMode="decimal" className={inputCls} />
      {r && (
        <div className="mt-3">
          <ResultLine label="Срок (нед+дн)" value={r.display} strong />
          <ResultLine label="Дней" value={String(r.days)} />
          <p className="mt-2 text-[10px] text-[var(--clinical-foreground-muted)]">{r.note}</p>
        </div>
      )}
    </div>
  );
}

function NtTool() {
  const [crl, setCrl] = useState("60");
  const [nt, setNt] = useState("");
  const r: NtReferenceResult | null = useMemo(() => (num(crl) != null ? ntReference(num(crl)!, num(nt)) : null), [crl, nt]);
  return (
    <div className={cardCls}>
      <h3 className="text-sm font-bold text-[var(--clinical-primary-deep)]">Nuchal translucency · центили <Badge tone="ok">ГОТОВО</Badge></h3>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>CRL, мм (45–84)</label>
          <input value={crl} onChange={(e) => setCrl(e.target.value)} inputMode="decimal" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>NT измеренная, мм</label>
          <input value={nt} onChange={(e) => setNt(e.target.value)} inputMode="decimal" placeholder="опционально" className={inputCls} />
        </div>
      </div>
      {r && (
        <div className="mt-3">
          <ResultLine label="Медиана NT" value={`${r.medianMm.toFixed(2)} мм`} strong />
          <ResultLine label="5-й центиль" value={`${r.p5Mm.toFixed(2)} мм`} />
          <ResultLine label="95-й центиль" value={`${r.p95Mm.toFixed(2)} мм`} />
          <ResultLine label="99-й центиль" value={`${r.p99Mm.toFixed(2)} мм`} />
          {r.mom != null && <ResultLine label="MoM измеренной" value={r.mom.toFixed(2)} strong />}
          {r.zScore != null && <ResultLine label="z-score (log10)" value={r.zScore.toFixed(2)} />}
          <p className="mt-2 text-[10px] text-[var(--clinical-foreground-muted)]">{r.note}</p>
        </div>
      )}
    </div>
  );
}

const CPR_BAND_LABEL: Record<CprResult["band"], string> = {
  normal: "норма",
  borderline: "пограничный",
  reduced: "снижен",
  severely_reduced: "резко снижен",
};

function CprTool() {
  const [ua, setUa] = useState("1.0");
  const [mca, setMca] = useState("1.3");
  const r: CprResult | null = useMemo(() => (num(ua) != null && num(mca) != null && num(ua)! > 0 ? cerebroplacentalRatio(num(ua)!, num(mca)!) : null), [ua, mca]);
  return (
    <div className={cardCls}>
      <h3 className="text-sm font-bold text-[var(--clinical-primary-deep)]">Fetal Doppler · CPR <Badge tone="ok">ГОТОВО</Badge></h3>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>UA PI</label>
          <input value={ua} onChange={(e) => setUa(e.target.value)} inputMode="decimal" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>MCA PI</label>
          <input value={mca} onChange={(e) => setMca(e.target.value)} inputMode="decimal" className={inputCls} />
        </div>
      </div>
      {r && (
        <div className="mt-3">
          <ResultLine label="CPR (MCA/UA)" value={r.value.toFixed(2)} strong />
          <ResultLine label="Интерпретация" value={CPR_BAND_LABEL[r.band]} />
          <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">{r.interpretation}</p>
          <p className="mt-2 text-[10px] text-[var(--clinical-foreground-muted)]">{r.note}</p>
        </div>
      )}
    </div>
  );
}

function PlannedTool({ title, stage }: { title: string; stage: string }) {
  return (
    <div className={`${cardCls} opacity-60`}>
      <h3 className="text-sm font-bold text-[var(--clinical-foreground-muted)]">
        {title} <Badge tone="s2">{stage}</Badge>
      </h3>
      <p className="mt-2 text-xs text-[var(--clinical-foreground-muted)]">
        Реализация по опубликованным формулам / партнёрству — следующий заход. См. FMF_11-13_DIGEST.md §10.
      </p>
    </div>
  );
}

export function FmfCalculatorsHubClient() {
  return (
    <div className="mx-auto max-w-4xl">
      <section className="mt-2">
        <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
          Оценка / менеджмент
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <DatingTool />
          <NtTool />
          <CprTool />
          <div className="grid gap-4">
            <PlannedTool title="Fetal growth · EFW + центили" stage="ЭТАП 2" />
            <PlannedTool title="Birth weight · FMF charts 2018" stage="ЭТАП 2" />
            <PlannedTool title="Uterine artery PI · центиль" stage="ЭТАП 2" />
          </div>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
          Предикция риска
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <PlannedTool title="Trisomies · полные LR-модели" stage="ЭТАП 2" />
          <PlannedTool title="Preterm birth · history / cervix" stage="ЭТАП 2" />
          <PlannedTool title="Preeclampsia · SGA · GDM" stage="ЭТАП 3" />
          <PlannedTool title="Fetal anemia · MCA PSV MoM" stage="ЭТАП 3" />
        </div>
        <p className="mt-3 text-xs text-[var(--clinical-foreground-muted)]">
          Учебный расчёт риска трисомий уже доступен в разделе <b>«FMF · скрининг 11–13 нед»</b>; полные модели Wright/Nicolaides — этап 2.
        </p>
      </section>

      <div className="mt-5 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/20 px-4 py-3">
        <p className="text-[11px] text-[var(--clinical-foreground-muted)]">{ATTRIBUTION}</p>
      </div>
    </div>
  );
}
