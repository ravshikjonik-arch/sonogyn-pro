"use client";

import type { ThyroidStructuredReportInput } from "@repo/types";
import { THYROID_TIRADS_V1_TEMPLATE_SLUG } from "@repo/report-engine";
import {
  COMPOSITION_OPTIONS,
  ECHOGENIC_FOCI_OPTIONS,
  ECHOGENICITY_OPTIONS,
  MARGIN_OPTIONS,
  SHAPE_OPTIONS,
} from "@repo/tirads-acr";
import { useMemo, useState } from "react";

import { StructuredReportWorkspace } from "@/components/reports/StructuredReportWorkspace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | "";
  options: { value: T; labelRu: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      <select
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.labelRu}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      <input
        type="number"
        min={0}
        step="any"
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function ThyroidReportWorkspace() {
  const [composition, setComposition] = useState<ThyroidStructuredReportInput["morphology"]["composition"]>("solid");
  const [echogenicity, setEchogenicity] =
    useState<ThyroidStructuredReportInput["morphology"]["echogenicity"]>("hypoechoic");
  const [shape, setShape] = useState<ThyroidStructuredReportInput["morphology"]["shape"]>("wider_than_tall");
  const [margin, setMargin] = useState<ThyroidStructuredReportInput["morphology"]["margin"]>("smooth");
  const [echogenicFoci, setEchogenicFoci] =
    useState<ThyroidStructuredReportInput["morphology"]["echogenicFoci"]>("none_or_comet_tail");
  const [noduleMm, setNoduleMm] = useState("12");
  const [volumeMl, setVolumeMl] = useState("");
  const [noduleLocation, setNoduleLocation] = useState("правая доля");
  const [freeText, setFreeText] = useState("");

  const input = useMemo((): ThyroidStructuredReportInput => {
    const noduleMaxDiameterMm = noduleMm ? Number.parseFloat(noduleMm) : undefined;
    const thyroidVolumeMl = volumeMl ? Number.parseFloat(volumeMl) : undefined;
    return {
      domain: "thyroid",
      measurements: {
        noduleMaxDiameterMm: Number.isFinite(noduleMaxDiameterMm) ? noduleMaxDiameterMm : undefined,
        thyroidVolumeMl: Number.isFinite(thyroidVolumeMl) ? thyroidVolumeMl : undefined,
      },
      morphology: {
        composition,
        echogenicity,
        shape,
        margin,
        echogenicFoci,
        noduleLocation: noduleLocation.trim() || undefined,
      },
      freeTextFindings: freeText.trim() || undefined,
    };
  }, [composition, echogenicFoci, echogenicity, freeText, margin, noduleLocation, noduleMm, shape, volumeMl]);

  return (
    <StructuredReportWorkspace
      templateSlug={THYROID_TIRADS_V1_TEMPLATE_SLUG}
      title="Протокол · щитовидная · TI-RADS"
      description="ACR TI-RADS — описание, категория, рекомендации по ТАБ и наблюдению. Assistive-режим."
      input={input}
      backHref="/reports"
      backLabel="← Все протоколы"
      exportFilenameBase="sre-thyroid-tirads"
      exportTitle="Структурированный протокол · TI-RADS"
      formPanel={
        <Card className="border-[var(--clinical-border)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Признаки узла (ACR TI-RADS)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SelectField label="Composition" value={composition ?? ""} options={COMPOSITION_OPTIONS} onChange={setComposition} />
            <SelectField label="Echogenicity" value={echogenicity ?? ""} options={ECHOGENICITY_OPTIONS} onChange={setEchogenicity} />
            <SelectField label="Shape" value={shape ?? ""} options={SHAPE_OPTIONS} onChange={setShape} />
            <SelectField label="Margin" value={margin ?? ""} options={MARGIN_OPTIONS} onChange={setMargin} />
            <SelectField
              label="Echogenic foci"
              value={echogenicFoci ?? ""}
              options={ECHOGENIC_FOCI_OPTIONS}
              onChange={setEchogenicFoci}
            />
            <NumField label="Диаметр узла, мм" value={noduleMm} onChange={setNoduleMm} placeholder="12" />
            <NumField label="Объём ЩЖ, мл" value={volumeMl} onChange={setVolumeMl} placeholder="опционально" />
            <label className="block text-sm sm:col-span-2">
              <span className="font-medium">Локализация</span>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                value={noduleLocation}
                onChange={(e) => setNoduleLocation(e.target.value)}
              />
            </label>
            <label className="block text-sm sm:col-span-full">
              <span className="font-medium">Доп. находки</span>
              <textarea
                className="mt-1 min-h-[72px] w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
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
