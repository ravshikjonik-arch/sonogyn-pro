"use client";

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

export const RISK_PLACEHOLDERS = [
  {
    id: "trisomies",
    title: "Трисомии",
    stage: "ЭТАП 2",
    desc: "Полные модели отношения правдоподобия Wright/Nicolaides (замена учебных констант демо)",
  },
  {
    id: "ptb",
    title: "Преждевременные роды · анамнез и шейка",
    stage: "ЭТАП 2",
    desc: "Анамнез; длина шейки матки (связка с калькулятором длины шейки в кабинете)",
  },
  {
    id: "pe",
    title: "Преэклампсия",
    stage: "ЭТАП 3",
    desc: "САД + PI МА + PlGF (Poon/Wright, 2012–2013) — нужен лабораторный партнёр",
  },
  {
    id: "sga",
    title: "Маловесность для срока (ЗРП)",
    stage: "ЭТАП 3",
    desc: "Модель ЗРП FMF + центили роста 2018",
  },
  {
    id: "gdm",
    title: "Гестационный сахарный диабет",
    stage: "ЭТАП 3",
    desc: "Модель ГСД FMF",
  },
  {
    id: "anemia",
    title: "Анемия плода",
    stage: "ЭТАП 3",
    desc: "ПСВ СМА >1,5 MoM (Mari 2000) — расчёт уже в модуле платформы",
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
          Оценка и тактика (этап 1) · предикция риска — в разработке
        </p>
      </div>

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
        <h3 className="mb-3 text-base font-medium text-[var(--clinical-foreground)]">
          Предикция риска
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {RISK_PLACEHOLDERS.map((item) => (
            <Card
              key={item.id}
              className="border-dashed border-[var(--clinical-border)] bg-[var(--clinical-surface)] opacity-90"
            >
              <CardHeader className="pb-2">
                <RiskStageBadge stage={item.stage} />
                <CardTitle className="text-base">{item.title}</CardTitle>
                <CardDescription>{item.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
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

function motionTeachGrid() {
  return null;
}