"use client";

import { useState } from "react";

import { MyomaChrome } from "@/components/education/myoma/MyomaChrome";
import {
  classifyFigo,
  dopplerIndices,
  ellipsoidVolume,
  growthDynamics,
  hybridFigo,
  intramuralComponent,
} from "@repo/myoma-education/calc";

const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--clinical-primary)]";

const fieldClass = `w-full rounded-xl border border-[var(--clinical-border)] bg-transparent px-3 py-2 text-sm ${focus}`;

const LOCATIONS = [
  { id: "intracavitary", label: "Внутри полости" },
  { id: "submucosal", label: "Субмукозный" },
  { id: "intramural", label: "Интрамуральный" },
  { id: "subserosal", label: "Субсерозный" },
  { id: "other", label: "Иная локализация" },
] as const;

function formatRu(value: number, digits: number): string {
  return value.toLocaleString("ru-RU", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function parseNumber(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-xs text-[var(--clinical-foreground)]">
      {message}
    </p>
  );
}

function ResultBlock({
  formula,
  rows,
  note,
}: {
  formula?: string;
  rows: { label: string; value: string }[];
  note?: string;
}) {
  return (
    <div className="space-y-2 rounded-2xl bg-[var(--clinical-muted)] p-4" role="status">
      {rows.map((row) => (
        <p key={row.label} className="text-sm text-[var(--clinical-foreground)]">
          <span className="font-semibold">{row.label}:</span> {row.value}
        </p>
      ))}
      {formula ? <p className="text-xs text-[var(--clinical-foreground-muted)]">Формула: {formula}</p> : null}
      {note ? <p className="max-w-[72ch] text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">{note}</p> : null}
    </div>
  );
}

export function MyomaCalculatorsClient({
  disclaimer,
  figoNote,
  growthWarning,
  dopplerWarning,
}: {
  disclaimer: string;
  figoNote: string;
  growthWarning: string;
  dopplerWarning: string;
}) {
  return (
    <MyomaChrome title="Калькуляторы описания" kicker="Миома матки">
      <p className="max-w-[72ch] text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">{disclaimer}</p>
      <div className="grid gap-4">
        <VolumeCard />
        <IntramuralCard />
        <FigoCard note={figoNote} />
        <GrowthCard warning={growthWarning} />
        <DopplerCard warning={dopplerWarning} />
      </div>
    </MyomaChrome>
  );
}

function VolumeCard() {
  const [d1, setD1] = useState("");
  const [d2, setD2] = useState("");
  const [d3, setD3] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ReturnType<typeof ellipsoidVolume> | null>(null);
  const [copied, setCopied] = useState(false);

  function calculate() {
    const next: Record<string, string> = {};
    const values = [d1, d2, d3].map((raw, index) => {
      const name = `Диаметр ${index + 1}`;
      const parsed = parseNumber(raw);
      if (parsed == null) next[`d${index + 1}`] = raw.trim() ? `${name}: введите число` : `Укажите ${name.toLowerCase()}`;
      else if (parsed <= 0) next[`d${index + 1}`] = `${name}: нужно больше нуля`;
      return parsed;
    });
    setErrors(next);
    setCopied(false);
    if (Object.keys(next).length || values.some((value) => value == null)) {
      setResult(null);
      return;
    }
    setResult(ellipsoidVolume(values as number[]));
  }

  async function copyProtocol() {
    if (!result) return;
    const text = `Узел ${d1} × ${d2} × ${d3} мм; средний диаметр ${formatRu(result.meanDiameterMm, 1)} мм; расчётный объём ${formatRu(result.volumeCm3, 2)} см³ (формула эллипсоида).`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
  }

  return (
    <section className="space-y-3 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4">
      <h2 className="text-lg font-semibold">Объём узла / матки</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["d1", "Диаметр 1", d1, setD1],
          ["d2", "Диаметр 2", d2, setD2],
          ["d3", "Диаметр 3", d3, setD3],
        ].map(([name, label, value, setValue]) => (
          <label key={String(name)} className="space-y-1 text-sm">
            <span>{String(label)}, мм</span>
            <input
              className={fieldClass}
              inputMode="decimal"
              value={String(value)}
              aria-invalid={Boolean(errors[String(name)])}
              aria-describedby={errors[String(name)] ? `${name}-error` : undefined}
              onChange={(event) => {
                (setValue as (v: string) => void)(event.target.value);
                setResult(null);
              }}
            />
            <FieldError id={`${name}-error`} message={errors[String(name)]} />
          </label>
        ))}
      </div>
      <button type="button" className={`rounded-full bg-[var(--clinical-muted)] px-4 py-2 text-sm font-semibold ${focus}`} onClick={calculate}>
        Рассчитать
      </button>
      {result ? (
        <>
          <ResultBlock
            formula={result.formula}
            rows={[
              { label: "Средний диаметр", value: `${formatRu(result.meanDiameterMm, 1)} мм` },
              { label: "Объём", value: `${formatRu(result.volumeCm3, 2)} см³` },
            ]}
          />
          <button type="button" className={`text-sm underline ${focus}`} onClick={() => void copyProtocol()}>
            {copied ? "Текст скопирован" : "Скопировать формулировку для протокола"}
          </button>
        </>
      ) : (
        <p className="text-sm text-[var(--clinical-foreground-muted)]">Введите параметры</p>
      )}
    </section>
  );
}

function IntramuralCard() {
  const [mean, setMean] = useState("");
  const [part, setPart] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [percent, setPercent] = useState<number | null>(null);

  function calculate() {
    const next: Record<string, string> = {};
    const meanValue = parseNumber(mean);
    const partValue = parseNumber(part);
    if (meanValue == null) next.mean = mean.trim() ? "Средний диаметр: введите число" : "Укажите средний диаметр";
    else if (meanValue <= 0) next.mean = "Средний диаметр: нужно больше нуля";
    if (partValue == null) next.part = part.trim() ? "Интрамуральный компонент: введите число" : "Укажите интрамуральный компонент";
    else if (partValue < 0) next.part = "Интрамуральный компонент не может быть отрицательным";
    else if (meanValue != null && meanValue > 0 && partValue > meanValue) {
      next.part = "Интрамуральный компонент не может быть больше среднего диаметра";
    }
    setErrors(next);
    if (Object.keys(next).length || meanValue == null || partValue == null) {
      setPercent(null);
      return;
    }
    setPercent(intramuralComponent(meanValue, partValue));
  }

  return (
    <section className="space-y-3 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4">
      <h2 className="text-lg font-semibold">Доля интрамурального компонента</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span>Средний диаметр узла, мм</span>
          <input className={fieldClass} inputMode="decimal" value={mean} aria-invalid={Boolean(errors.mean)} aria-describedby={errors.mean ? "mean-error" : undefined} onChange={(event) => { setMean(event.target.value); setPercent(null); }} />
          <FieldError id="mean-error" message={errors.mean} />
        </label>
        <label className="space-y-1 text-sm">
          <span>Интрамуральный компонент, мм</span>
          <input className={fieldClass} inputMode="decimal" value={part} aria-invalid={Boolean(errors.part)} aria-describedby={errors.part ? "part-error" : undefined} onChange={(event) => { setPart(event.target.value); setPercent(null); }} />
          <FieldError id="part-error" message={errors.part} />
        </label>
      </div>
      <button type="button" className={`rounded-full bg-[var(--clinical-muted)] px-4 py-2 text-sm font-semibold ${focus}`} onClick={calculate}>
        Рассчитать
      </button>
      {percent != null ? (
        <ResultBlock
          formula="Доля = интрамуральный компонент / средний диаметр × 100"
          rows={[{ label: "Интрамуральная доля", value: `${formatRu(percent, 1)} %` }]}
          note="Доля считается от среднего диаметра, не от объёма."
        />
      ) : (
        <p className="text-sm text-[var(--clinical-foreground-muted)]">Введите параметры</p>
      )}
    </section>
  );
}

function FigoCard({ note }: { note: string }) {
  const [location, setLocation] = useState("");
  const [pedunculated, setPedunculated] = useState(false);
  const [contactsEndometrium, setContactsEndometrium] = useState(false);
  const [percent, setPercent] = useState("");
  const [endo, setEndo] = useState("");
  const [sero, setSero] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [figo, setFigo] = useState<{ figo: string; labelRu: string } | null>(null);
  const [hybrid, setHybrid] = useState<{ figo: string; labelRu: string } | null>(null);

  const needsPercent = location === "submucosal" || (location === "subserosal" && !pedunculated);

  function calculate() {
    const next: Record<string, string> = {};
    if (!location) next.location = "Выберите основную топографию";
    if (location === "intracavitary" && !pedunculated) next.pedunculated = "Для внутриполостного узла на ножке отметьте «узел на ножке»";
    let percentValue: number | undefined;
    if (needsPercent) {
      const parsed = parseNumber(percent);
      if (parsed == null) next.percent = percent.trim() ? "Интрамуральная доля: введите число" : "Укажите интрамуральную долю";
      else if (parsed < 0 || parsed > 100) next.percent = "Интрамуральная доля: от 0 до 100";
      else percentValue = parsed;
    }
    setErrors(next);
    if (Object.keys(next).length || !location) {
      setFigo(null);
      return;
    }
    setFigo(
      classifyFigo({
        location,
        pedunculated,
        contactsEndometrium,
        intramuralPercent: percentValue,
      }),
    );
  }

  function calculateHybrid() {
    const next: Record<string, string> = {};
    if (!["0", "1", "2", "3", "4"].includes(endo)) next.endo = "Первым укажите отношение к эндометрию: 0–4";
    if (!["5", "6", "7"].includes(sero)) next.sero = "Вторым укажите отношение к серозной оболочке: 5–7";
    setErrors((current) => ({ ...current, endo: next.endo ?? "", sero: next.sero ?? "" }));
    if (next.endo || next.sero) {
      setHybrid(null);
      return;
    }
    setHybrid(hybridFigo(endo, sero));
  }

  return (
    <section className="space-y-3 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4">
      <h2 className="text-lg font-semibold">Топография FIGO</h2>
      <p className="max-w-[72ch] text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
        Помощник по данным, которые ввёл врач. Изображение не анализируется.
      </p>
      <label className="block space-y-1 text-sm">
        <span>Основная топография</span>
        <select className={fieldClass} value={location} aria-invalid={Boolean(errors.location)} aria-describedby={errors.location ? "location-error" : undefined} onChange={(event) => { setLocation(event.target.value); setFigo(null); }}>
          <option value="">Выберите</option>
          {LOCATIONS.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
        <FieldError id="location-error" message={errors.location} />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={pedunculated} onChange={(event) => { setPedunculated(event.target.checked); setFigo(null); }} />
        Узел на ножке
      </label>
      <FieldError id="pedunculated-error" message={errors.pedunculated} />
      {location === "intramural" ? (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={contactsEndometrium} onChange={(event) => { setContactsEndometrium(event.target.checked); setFigo(null); }} />
          Контакт с эндометрием
        </label>
      ) : null}
      {needsPercent ? (
        <label className="block space-y-1 text-sm">
          <span>Интрамуральная доля, %</span>
          <input className={fieldClass} inputMode="decimal" value={percent} aria-invalid={Boolean(errors.percent)} aria-describedby={errors.percent ? "percent-error" : undefined} onChange={(event) => { setPercent(event.target.value); setFigo(null); }} />
          <FieldError id="percent-error" message={errors.percent} />
        </label>
      ) : null}
      <button type="button" className={`rounded-full bg-[var(--clinical-muted)] px-4 py-2 text-sm font-semibold ${focus}`} onClick={calculate}>
        Определить тип
      </button>
      {figo ? (
        <ResultBlock rows={[{ label: "Тип FIGO", value: figo.figo }, { label: "Описание", value: figo.labelRu }]} note={note} />
      ) : (
        <p className="text-sm text-[var(--clinical-foreground-muted)]">Введите параметры</p>
      )}
      <fieldset className="space-y-3 border-t border-[var(--clinical-border)] pt-3">
        <legend className="text-sm font-semibold">Гибридная запись</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span>Отношение к эндометрию</span>
            <select className={fieldClass} value={endo} aria-invalid={Boolean(errors.endo)} onChange={(event) => { setEndo(event.target.value); setHybrid(null); }}>
              <option value="">0–4</option>
              {["0", "1", "2", "3", "4"].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            <FieldError id="endo-error" message={errors.endo} />
          </label>
          <label className="space-y-1 text-sm">
            <span>Отношение к серозной оболочке</span>
            <select className={fieldClass} value={sero} aria-invalid={Boolean(errors.sero)} onChange={(event) => { setSero(event.target.value); setHybrid(null); }}>
              <option value="">5–7</option>
              {["5", "6", "7"].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            <FieldError id="sero-error" message={errors.sero} />
          </label>
        </div>
        <button type="button" className={`rounded-full bg-[var(--clinical-muted)] px-4 py-2 text-sm font-semibold ${focus}`} onClick={calculateHybrid}>
          Собрать гибридную запись
        </button>
        {hybrid ? <ResultBlock rows={[{ label: "FIGO", value: hybrid.figo }]} note={hybrid.labelRu} /> : null}
      </fieldset>
    </section>
  );
}

function GrowthCard({ warning }: { warning: string }) {
  const [previous, setPrevious] = useState(["", "", ""]);
  const [current, setCurrent] = useState(["", "", ""]);
  const [days, setDays] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ReturnType<typeof growthDynamics> | null>(null);

  function readTriplet(values: string[], prefix: string, next: Record<string, string>) {
    return values.map((raw, index) => {
      const key = `${prefix}${index}`;
      const parsed = parseNumber(raw);
      if (parsed == null) next[key] = raw.trim() ? "Введите число" : "Укажите диаметр";
      else if (parsed <= 0) next[key] = "Диаметр должен быть больше нуля";
      return parsed;
    });
  }

  function calculate() {
    const next: Record<string, string> = {};
    const previousValues = readTriplet(previous, "p", next);
    const currentValues = readTriplet(current, "c", next);
    const interval = parseNumber(days);
    if (interval == null) next.days = days.trim() ? "Интервал: введите число" : "Укажите интервал";
    else if (!Number.isInteger(interval) || interval < 1) next.days = "Интервал: целое число дней от 1";
    setErrors(next);
    if (Object.keys(next).length || previousValues.some((v) => v == null) || currentValues.some((v) => v == null) || interval == null) {
      setResult(null);
      return;
    }
    setResult(growthDynamics(previousValues as number[], currentValues as number[], interval));
  }

  return (
    <section className="space-y-3 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4">
      <h2 className="text-lg font-semibold">Динамика узла</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <fieldset className="space-y-2">
          <legend className="text-sm">Прежние диаметры, мм</legend>
          {previous.map((value, index) => (
            <label key={`p${index}`} className="block space-y-1 text-sm">
              <span className="sr-only">Прежний диаметр {index + 1}</span>
              <input className={fieldClass} inputMode="decimal" aria-label={`Прежний диаметр ${index + 1}`} value={value} aria-invalid={Boolean(errors[`p${index}`])} onChange={(event) => { const copy = [...previous]; copy[index] = event.target.value; setPrevious(copy); setResult(null); }} />
              <FieldError id={`p${index}-error`} message={errors[`p${index}`]} />
            </label>
          ))}
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="text-sm">Текущие диаметры, мм</legend>
          {current.map((value, index) => (
            <label key={`c${index}`} className="block space-y-1 text-sm">
              <span className="sr-only">Текущий диаметр {index + 1}</span>
              <input className={fieldClass} inputMode="decimal" aria-label={`Текущий диаметр ${index + 1}`} value={value} aria-invalid={Boolean(errors[`c${index}`])} onChange={(event) => { const copy = [...current]; copy[index] = event.target.value; setCurrent(copy); setResult(null); }} />
              <FieldError id={`c${index}-error`} message={errors[`c${index}`]} />
            </label>
          ))}
        </fieldset>
      </div>
      <label className="block space-y-1 text-sm">
        <span>Интервал, дни</span>
        <input className={fieldClass} inputMode="numeric" value={days} aria-invalid={Boolean(errors.days)} aria-describedby={errors.days ? "days-error" : undefined} onChange={(event) => { setDays(event.target.value); setResult(null); }} />
        <FieldError id="days-error" message={errors.days} />
      </label>
      <button type="button" className={`rounded-full bg-[var(--clinical-muted)] px-4 py-2 text-sm font-semibold ${focus}`} onClick={calculate}>
        Рассчитать
      </button>
      {result ? (
        <ResultBlock
          rows={[
            { label: "Изменение среднего диаметра", value: `${formatRu(result.meanDiameterDeltaMm, 1)} мм` },
            { label: "Изменение объёма", value: `${formatRu(result.volumeDeltaCm3, 2)} см³` },
            { label: "Изменение объёма", value: `${formatRu(result.volumeChangePercent, 1)} %` },
            { label: "Линейная экстраполяция за 365 дней", value: `${formatRu(result.annualizedLinearChangePercent, 1)} %` },
          ]}
          note={`${warning} ${result.caveatRu}`}
        />
      ) : (
        <p className="text-sm text-[var(--clinical-foreground-muted)]">Введите параметры</p>
      )}
    </section>
  );
}

function DopplerCard({ warning }: { warning: string }) {
  const [psv, setPsv] = useState("");
  const [edv, setEdv] = useState("");
  const [tamv, setTamv] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ReturnType<typeof dopplerIndices> | null>(null);

  function calculate() {
    const next: Record<string, string> = {};
    const psvValue = parseNumber(psv);
    const edvValue = parseNumber(edv);
    const tamvValue = parseNumber(tamv);
    if (psvValue == null) next.psv = psv.trim() ? "PSV: введите число" : "Укажите PSV";
    else if (psvValue <= 0) next.psv = "PSV: нужно больше нуля";
    if (edvValue == null) next.edv = edv.trim() ? "EDV: введите число" : "Укажите EDV";
    else if (psvValue != null && edvValue > psvValue) next.edv = "EDV не может быть больше PSV";
    if (tamvValue == null) next.tamv = tamv.trim() ? "TAMV: введите число" : "Укажите TAMV";
    else if (tamvValue <= 0) next.tamv = "TAMV: нужно больше нуля";
    else if (psvValue != null && tamvValue > psvValue) next.tamv = "TAMV не может быть больше PSV";
    setErrors(next);
    if (Object.keys(next).length || psvValue == null || edvValue == null || tamvValue == null) {
      setResult(null);
      return;
    }
    setResult(dopplerIndices(psvValue, edvValue, tamvValue));
  }

  return (
    <section className="space-y-3 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4">
      <h2 className="text-lg font-semibold">Допплеровские индексы</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {(
          [
            ["psv", "PSV, см/с", psv, setPsv],
            ["edv", "EDV, см/с", edv, setEdv],
            ["tamv", "TAMV, см/с", tamv, setTamv],
          ] as const
        ).map(([name, label, value, setValue]) => (
          <label key={name} className="space-y-1 text-sm">
            <span>{label}</span>
            <input className={fieldClass} inputMode="decimal" value={value} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `${name}-error` : undefined} onChange={(event) => { setValue(event.target.value); setResult(null); }} />
            <FieldError id={`${name}-error`} message={errors[name]} />
          </label>
        ))}
      </div>
      <button type="button" className={`rounded-full bg-[var(--clinical-muted)] px-4 py-2 text-sm font-semibold ${focus}`} onClick={calculate}>
        Рассчитать
      </button>
      {result ? (
        <ResultBlock
          formula="RI = (PSV − EDV) / PSV; PI = (PSV − EDV) / TAMV"
          rows={[
            { label: "Индекс резистентности RI", value: formatRu(result.ri, 2) },
            { label: "Индекс пульсации PI", value: formatRu(result.pi, 2) },
          ]}
          note={`${warning} ${result.caveatRu}`}
        />
      ) : (
        <p className="text-sm text-[var(--clinical-foreground-muted)]">Введите параметры</p>
      )}
    </section>
  );
}
