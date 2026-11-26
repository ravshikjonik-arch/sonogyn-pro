"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  bwZ,
  centileFromZ,
  cprZ,
  expectedCpr,
  expectedFw,
  expectedMca,
  expectedUa,
  expectedUtpi,
  formatGa,
  fwZ,
  gaFromCrl,
  gaFromHc,
  expectedMcaPsv,
  mcaPsvZ,
  mcaZ,
  ntCentile,
  ntDelta,
  ntMedian,
  uaZ,
  utpiZ,
} from "@repo/medical-calculations/fmf/fmf-core";

type Row = { label: string; value: string; sub?: string };
type Tool = {
  id: string;
  group: "assess" | "risk";
  title: string;
  source: string;
  inputs: {
    key: string;
    label: string;
    unit?: string;
    min?: number;
    max?: number;
    placeholder?: string;
  }[];
  compute: (v: Record<string, number>) => Row[] | null;
  note?: string;
};

const days = (w: number, d = 0) => w * 7 + d;
const f = (x: number | null | undefined, n = 2) =>
  x === null || x === undefined || Number.isNaN(x) ? "—" : x.toFixed(n);

export const FMF_TOOLS: Tool[] = [
  {
    id: "dating",
    group: "assess",
    title: "Датирование беременности",
    source: "Robinson & Fleming, BJOG 1975 (КТР) · Snijders & Nicolaides, 1994 (ОГ, UOG)",
    inputs: [
      { key: "crl", label: "КТР", unit: "мм", min: 45, max: 84 },
      { key: "hc", label: "ОГ (необяз.)", unit: "мм", min: 155, max: 226 },
    ],
    compute: (v) => {
      const rows: Row[] = [];
      if (v.crl) {
        const ga = gaFromCrl(v.crl);
        if (ga !== null) {
          rows.push({
            label: "ГА по КТР",
            value: formatGa(ga),
            sub: `${f(ga, 1)} дней`,
          });
        }
      }
      if (v.hc) {
        const ga = gaFromHc(v.hc);
        if (ga !== null) {
          rows.push({
            label: "ГА по ОГ",
            value: formatGa(ga),
            sub: `${f(ga, 1)} дней`,
          });
        }
      }
      return rows.length ? rows : null;
    },
  },
  {
    id: "nt",
    group: "assess",
    title: "Толщина воротникового пространства (ТВП)",
    source: "Wright D и соавт. UOG 2008 — смесевая модель ТВП",
    inputs: [
      { key: "crl", label: "КТР", unit: "мм", min: 45, max: 84 },
      { key: "nt", label: "ТВП", unit: "мм", min: 0.1, max: 9 },
    ],
    compute: (v) => {
      if (!v.crl || !v.nt) return null;
      const c = ntCentile(v.nt, v.crl);
      return [
        { label: "Медиана ТВП", value: f(ntMedian(v.crl), 2), sub: "мм" },
        { label: "Дельта", value: f(ntDelta(v.nt, v.crl), 2), sub: "мм" },
        {
          label: "Центиль",
          value: c === null ? "—" : String(c),
          sub: c !== null && c > 99 ? ">99" : undefined,
        },
      ];
    },
    note: "99-й центиль ≈ 3,5 мм и не зависит от КТР. ТВП ≥3,5 мм → биопсия хориона + кариотип + микроаррей.",
  },
  {
    id: "growth",
    group: "assess",
    title: "Рост плода (ПВМ, z-оценка и центиль)",
    source: "Wright D и соавт. UOG 2018 — кривые веса FMF",
    inputs: [
      { key: "w", label: "Срок, недель", min: 21.5, max: 42 },
      { key: "d", label: "+ дней", min: 0, max: 6 },
      { key: "efw", label: "ПВМ", unit: "г", min: 100, max: 6000 },
    ],
    compute: (v) => {
      const ga = days(v.w, v.d);
      const z = fwZ(v.efw, ga);
      if (z === null) return null;
      return [
        { label: "Ожидаемый вес", value: f(expectedFw(ga), 0), sub: "г (медиана)" },
        { label: "z-оценка", value: f(z, 3) },
        { label: "Центиль", value: String(centileFromZ(z)) },
      ];
    },
    note: "Для центилей используйте также фетометрию (Hadlock) — сверка расхождений в карточке приёма.",
  },
  {
    id: "bw",
    group: "assess",
    title: "Вес при рождении",
    source: "Wright D и соавт. UOG 2018",
    inputs: [
      { key: "w", label: "Срок, недель", min: 22, max: 42 },
      { key: "bw", label: "Вес", unit: "г", min: 200, max: 6000 },
    ],
    compute: (v) => {
      const z = bwZ(v.bw, v.w);
      if (z === null) return null;
      return [
        { label: "z-оценка (полиномиальная модель)", value: f(z, 3) },
        { label: "Центиль", value: String(centileFromZ(z)) },
      ];
    },
  },
  {
    id: "doppler",
    group: "assess",
    title: "Допплер плода (ПА · СМА · ЦПС)",
    source: "Референсные диапазоны FMF (сверка с архивом fetalmedicine.org, 11.2026)",
    inputs: [
      { key: "w", label: "Срок, недель", min: 20, max: 42 },
      { key: "ua", label: "PI пупочной артерии", min: 0.3, max: 4 },
      { key: "mca", label: "PI средней мозговой", min: 0.3, max: 4 },
    ],
    compute: (v) => {
      const ga = days(v.w);
      const z1 = uaZ(v.ua, ga),
        z2 = mcaZ(v.mca, ga);
      const cpr = v.mca && v.ua ? v.mca / v.ua : null;
      const z3 = cpr ? cprZ(cpr, ga) : null;
      if (z1 === null || z2 === null) return null;
      return [
        {
          label: "PI ПА",
          value: `${f(v.ua)} · z ${f(z1)} · ц ${centileFromZ(z1)}`,
          sub: `медиана ${f(expectedUa(ga))}`,
        },
        {
          label: "PI СМА",
          value: `${f(v.mca)} · z ${f(z2)} · ц ${centileFromZ(z2)}`,
          sub: `медиана ${f(expectedMca(ga))}`,
        },
        {
          label: "ЦПС",
          value: cpr && z3 !== null ? `${f(cpr)} · z ${f(z3)} · ц ${centileFromZ(z3)}` : "—",
          sub: `медиана ${f(expectedCpr(ga))}`,
        },
      ];
    },
    note: "ЦПС ≤ 10-го центиля после 32 нед — низкое цереброплацентарное соотношение.",
  },
  {
    id: "utpi",
    group: "assess",
    title: "Индекс пульсации маточных артерий",
    source: "Референсные диапазоны FMF (сверка с архивом fetalmedicine.org, 11.2026)",
    inputs: [
      { key: "w", label: "Срок, недель", min: 20, max: 42 },
      { key: "pi", label: "PI МА (средний)", min: 0.2, max: 4 },
    ],
    compute: (v) => {
      const ga = days(v.w);
      const z = utpiZ(v.pi, ga);
      if (z === null) return null;
      return [
        {
          label: "PI маточных артерий",
          value: `${f(v.pi)} · z ${f(z)} · ц ${centileFromZ(z)}`,
          sub: `медиана ${f(expectedUtpi(ga))}`,
        },
      ];
    },
    note: "Средний PI МА ≥95-го центиля после 35 нед — маркер преэклампсии и риска ЗРП.",
  },
];

const FMF_STAGES = [
  { n: 1, title: "Оценка", status: "6 калькуляторов · fmf-core" },
  { n: 2, title: "Скрининг риска", status: "трисомии учебно · ПР → CL" },
  { n: 3, title: "Поздние риски", status: "ПЭ · ЗРП · ГСД · анемия" },
] as const;

type RiskPlaceholder = {
  id: string;
  title: string;
  stage: string;
  desc: string;
  href?: string;
  linkLabel?: string;
};

/** Маршруты этапов 2–3: учебные/ссылочные + встроенный калькулятор анемии ниже. */
export const RISK_PLACEHOLDERS: RiskPlaceholder[] = [
  {
    id: "trisomies",
    title: "Трисомии",
    stage: "ЭТАП 2",
    desc: "Учебная модель: априорный риск × ОП (не лицензированный алгоритм FMF). Полный clinical risk engine — только сертифицированный софт FMF.",
    href: "/tools/refs/fmf-11-13#fmf-edu-calc",
    linkLabel: "Учебный калькулятор 11–13 →",
  },
  {
    id: "ptb",
    title: "Преждевременные роды · анамнез и шейка",
    stage: "ЭТАП 2",
    desc: "Длина шейки матки и клинический контекст (ISUOG / RCOG).",
    href: "/tools/calc/ob/cervical-length",
    linkLabel: "Калькулятор длины шейки →",
  },
  {
    id: "pe",
    title: "Преэклампсия",
    stage: "ЭТАП 3",
    desc: "САД, PI маточных артерий, PlGF — модуль FMF I триместра (учебные перцентили).",
    href: "/ai/consultants/fmf?section=first",
    linkLabel: "FMF · I скрининговый срок →",
  },
  {
    id: "sga",
    title: "Маловесность для срока (ЗРП)",
    stage: "ЭТАП 3",
    desc: "ПВМ и центили по кривым FMF 2018 (калькулятор роста, этап 1).",
    href: "/tools/calc/fmf",
    linkLabel: "Калькулятор роста плода →",
  },
  {
    id: "gdm",
    title: "Гестационный сахарный диабет",
    stage: "ЭТАП 3",
    desc: "Справочник тактики и медикаментов беременности; риск-модель FMF — отдельная лицензия.",
    href: "/tools/calc/ob/pregnancy-medications",
    linkLabel: "Медикаменты при беременности →",
  },
];

function parseInputs(
  tool: Tool,
  raw: Record<string, string>,
): Record<string, number> | null {
  const out: Record<string, number> = {};
  for (const inp of tool.inputs) {
    const s = raw[inp.key]?.trim();
    if (!s) continue;
    const n = Number(s.replace(",", "."));
    if (!Number.isFinite(n)) return null;
    if (inp.min !== undefined && n < inp.min) return null;
    if (inp.max !== undefined && n > inp.max) return null;
    out[inp.key] = n;
  }
  return out;
}

function FmfAnemiaRiskCard() {
  const [weeks, setWeeks] = useState("24");
  const [psv, setPsv] = useState("");
  const [touched, setTouched] = useState(false);
  const w = Number(weeks.replace(",", "."));
  const v = Number(psv.replace(",", "."));
  const z = Number.isFinite(w) && Number.isFinite(v) && v > 0 ? mcaPsvZ(v, w) : null;
  const median = Number.isFinite(w) ? expectedMcaPsv(w) : null;
  const mom = median && Number.isFinite(v) && v > 0 ? v / median : null;
  const flag = mom !== null && mom > 1.5;

  return (
    <Card className="border-[var(--clinical-primary)]/30 bg-[var(--clinical-surface)]">
      <CardHeader className="pb-2">
        <RiskStageBadge stage="ЭТАП 3 · калькулятор" />
        <CardTitle className="text-base">Анемия плода (ПСВ СМА)</CardTitle>
        <CardDescription>Mari et al. 2000 · порог MoM &gt;1,5 — справочно, не диагноз.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="fmf-anemia-w" className="text-sm font-medium">
              Срок, недель (18–38)
            </label>
            <Input
              id="fmf-anemia-w"
              inputMode="decimal"
              value={weeks}
              onChange={(e) => setWeeks(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="fmf-anemia-psv" className="text-sm font-medium">
              ПСВ СМА, см/с
            </label>
            <Input
              id="fmf-anemia-psv"
              inputMode="decimal"
              value={psv}
              onChange={(e) => setPsv(e.target.value)}
            />
          </div>
        </div>
        <Button type="button" size="sm" onClick={() => setTouched(true)}>
          Рассчитать
        </Button>
        {touched && z !== null && mom !== null ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            <li className="rounded-lg border border-[var(--clinical-border)] px-3 py-2 text-sm">
              Медиана ПСВ: {f(median, 1)} см/с
            </li>
            <li className="rounded-lg border border-[var(--clinical-border)] px-3 py-2 text-sm">
              MoM: {f(mom, 2)}
            </li>
            <li className="rounded-lg border border-[var(--clinical-border)] px-3 py-2 text-sm">
              z-оценка: {f(z, 2)}
            </li>
            <li
              className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                flag
                  ? "border-[var(--clinical-danger,#dc2626)]/50 text-[var(--clinical-danger,#dc2626)]"
                  : "border-[var(--clinical-border)]"
              }`}
            >
              {flag ? "MoM > 1,5 — подозрение на анемию плода" : "MoM ≤ 1,5"}
            </li>
          </ul>
        ) : touched ? (
          <p className="text-sm text-amber-600 dark:text-amber-400">Проверьте срок и ПСВ.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function FmfCalculators() {
  const assess = useMemo(() => FMF_TOOLS.filter((t) => t.group === "assess"), []);
  const [activeId, setActiveId] = useState(assess[0]?.id ?? "dating");
  const active = assess.find((t) => t.id === activeId) ?? assess[0];
  const [raw, setRaw] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState(false);

  const parsed = active ? parseInputs(active, raw) : null;
  const rows = active && parsed ? active.compute(parsed) : null;

  return (
    <section id="calculators" className="scroll-mt-24 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--clinical-foreground)]">Калькуляторы FMF</h2>
        <p className="mt-1 text-sm text-[var(--clinical-foreground-muted)]">
          Три этапа платформы: оценка (публикации) → скрининг риска → поздние исходы.
        </p>
        <ol className="mt-3 flex flex-wrap gap-2">
          {FMF_STAGES.map((s) => (
            <li
              key={s.n}
              className="rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-surface-elevated)] px-3 py-2 text-xs"
            >
              <span className="font-bold text-[var(--clinical-primary-deep)]">Этап {s.n}.</span> {s.title}
              <span className="mt-0.5 block text-[var(--clinical-foreground-muted)]">{s.status}</span>
            </li>
          ))}
        </ol>
      </div>

      <p className="text-sm font-semibold text-[var(--clinical-foreground)]">Этап 1 · оценка и тактика</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {assess.map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => {
              setActiveId(tool.id);
              setRaw({});
              setTouched(false);
            }}
            className={`rounded-xl border p-4 text-left transition-colors ${
              tool.id === activeId
                ? "border-[var(--clinical-primary)] bg-[var(--clinical-surface-elevated)]"
                : "border-[var(--clinical-border)] bg-[var(--clinical-surface)] hover:border-[var(--clinical-border-strong)]"
            }`}
          >
            <p className="font-medium text-[var(--clinical-foreground)]">{tool.title}</p>
            <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">{tool.source}</p>
          </button>
        ))}
      </div>

      {active ? (
        <Card className="border-[var(--clinical-border)] bg-[var(--clinical-surface)]">
          <CardHeader>
            <CardTitle className="text-lg">{active.title}</CardTitle>
            <CardDescription>{active.source}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {active.inputs.map((inp) => (
                <div key={inp.key} className="space-y-1.5">
                  <label
                    htmlFor={`fmf-${active.id}-${inp.key}`}
                    className="text-sm font-medium text-[var(--clinical-foreground)]"
                  >
                    {inp.label}
                    {inp.unit ? ` (${inp.unit})` : ""}
                  </label>
                  <Input
                    id={`fmf-${active.id}-${inp.key}`}
                    inputMode="decimal"
                    placeholder={inp.placeholder}
                    value={raw[inp.key] ?? ""}
                    onChange={(e) => {
                      setRaw((prev) => ({ ...prev, [inp.key]: e.target.value }));
                      setTouched(true);
                    }}
                  />
                </div>
              ))}
            </div>
            <Button
              type="button"
              onClick={() => setTouched(true)}
              className="bg-[var(--clinical-primary)] text-[var(--clinical-primary-foreground)]"
            >
              Рассчитать
            </Button>
            {touched && rows ? (
              <ul className="grid gap-2 sm:grid-cols-2">
                {rows.map((row) => (
                  <li
                    key={row.label}
                    className="rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-surface-elevated)] px-4 py-3"
                  >
                    <p className="text-xs uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
                      {row.label}
                    </p>
                    <p className="text-lg font-semibold text-[var(--clinical-foreground)]">{row.value}</p>
                    {row.sub ? (
                      <p className="text-xs text-[var(--clinical-foreground-muted)]">{row.sub}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : touched ? (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Проверьте диапазоны полей или заполните обязательные значения.
              </p>
            ) : null}
            {active.note ? (
              <p className="text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">{active.note}</p>
            ) : null}
            <p className="text-xs text-[var(--clinical-foreground-muted)]">
              Справочный инструмент · не диагноз · решение за врачом
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div>
        <h3 className="mb-1 text-base font-medium text-[var(--clinical-foreground)]">
          Этапы 2–3 · предикция и маршрутизация
        </h3>
        <p className="mb-3 text-xs text-[var(--clinical-foreground-muted)]">
          Где нет лицензированного risk engine FMF — учебные модели и ссылки на инструменты платформы.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {RISK_PLACEHOLDERS.map((item) => (
            <Card
              key={item.id}
              className="border-[var(--clinical-primary)]/40 bg-[var(--clinical-surface)]"
            >
              <CardHeader className="pb-2">
                <RiskStageBadge stage={item.stage} />
                <CardTitle className="text-base">{item.title}</CardTitle>
                <CardDescription>{item.desc}</CardDescription>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="text-sm font-medium text-[var(--clinical-primary)] underline underline-offset-2"
                  >
                    {item.linkLabel ?? "Открыть →"}
                  </Link>
                ) : null}
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="mt-4">
          <FmfAnemiaRiskCard />
        </div>
      </div>
    </section>
  );
}

function RiskStageBadge({ stage }: { stage: string }) {
  return (
    <Badge variant="outline" className="mb-1 w-fit">
      {stage}
    </Badge>
  );
}
