"use client";

import type { ObstetricStructuredReportInput } from "@repo/types";
import { OBSTETRIC_BIOMETRY_V1_TEMPLATE_SLUG } from "@repo/report-engine";
import { useMemo, useState } from "react";

import { StructuredReportWorkspace } from "@/components/reports/StructuredReportWorkspace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function NumField({
  label,
  value,
  onChange,
  max,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  max?: number;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      <input
        type="number"
        min={0}
        max={max}
        step="any"
        className="clinical-form-control mt-1 w-full rounded-xl px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function ObstetricReportWorkspace() {
  const [weeks, setWeeks] = useState("20");
  const [days, setDays] = useState("3");
  const [crl, setCrl] = useState("");
  const [bpd, setBpd] = useState("48");
  const [hc, setHc] = useState("");
  const [ac, setAc] = useState("160");
  const [fl, setFl] = useState("33");
  const [efw, setEfw] = useState("");
  const [placenta, setPlacenta] = useState("задняя стенка");
  const [fluid, setFluid] = useState("норма");
  const [freeText, setFreeText] = useState("");

  const input = useMemo((): ObstetricStructuredReportInput => {
    const parse = (s: string) => {
      const n = Number.parseFloat(s);
      return Number.isFinite(n) ? n : undefined;
    };
    return {
      domain: "obstetric",
      biometry: {
        gestationalAgeWeeks: parse(weeks),
        gestationalAgeDays: parse(days),
        crlMm: parse(crl),
        bpdMm: parse(bpd),
        hcMm: parse(hc),
        acMm: parse(ac),
        flMm: parse(fl),
        efwGrams: parse(efw),
        placentaLocation: placenta.trim() || undefined,
        amnioticFluid: fluid.trim() || undefined,
      },
      freeTextFindings: freeText.trim() || undefined,
    };
  }, [ac, bpd, crl, days, efw, fl, fluid, freeText, hc, placenta, weeks]);

  const gaLabel =
    input.biometry.gestationalAgeWeeks != null
      ? `${input.biometry.gestationalAgeWeeks}+${input.biometry.gestationalAgeDays ?? 0}`
      : undefined;

  return (
    <StructuredReportWorkspace
      templateSlug={OBSTETRIC_BIOMETRY_V1_TEMPLATE_SLUG}
      title="Протокол · акушерство · биометрия"
      description="Срок, КТР/БПР/ОЖ/ДБ, масса плода — структурированное описание. Assistive-режим."
      input={input}
      backHref="/reports"
      backLabel="← Все протоколы"
      exportFilenameBase="sre-obstetric-biometry"
      exportTitle="Структурированный протокол · биометрия"
      exportMeta={gaLabel ? [{ label: "Срок", value: `${gaLabel} нед.` }] : undefined}
      formPanel={
        <Card className="border-[var(--clinical-border)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Биометрия плода</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <NumField label="Срок, нед" value={weeks} onChange={setWeeks} max={44} />
            <NumField label="Срок, дни" value={days} onChange={setDays} max={6} />
            <NumField label="КТР, мм" value={crl} onChange={setCrl} />
            <NumField label="БПР, мм" value={bpd} onChange={setBpd} />
            <NumField label="ОГ, мм" value={hc} onChange={setHc} />
            <NumField label="ОЖ, мм" value={ac} onChange={setAc} />
            <NumField label="ДБ, мм" value={fl} onChange={setFl} />
            <NumField label="Масса, г" value={efw} onChange={setEfw} />
            <label className="block text-sm sm:col-span-2">
              <span className="font-medium">Плацента</span>
              <input
                className="clinical-form-control mt-1 w-full rounded-xl px-3 py-2"
                value={placenta}
                onChange={(e) => setPlacenta(e.target.value)}
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="font-medium">Околоплодные воды</span>
              <input
                className="clinical-form-control mt-1 w-full rounded-xl px-3 py-2"
                value={fluid}
                onChange={(e) => setFluid(e.target.value)}
              />
            </label>
            <label className="block text-sm sm:col-span-full">
              <span className="font-medium">Доп. находки</span>
              <textarea
                className="clinical-form-control mt-1 min-h-[72px] w-full rounded-xl px-3 py-2"
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
              />
            </label>
          </CardContent>
        </Card>
      }
    />
  );
}
