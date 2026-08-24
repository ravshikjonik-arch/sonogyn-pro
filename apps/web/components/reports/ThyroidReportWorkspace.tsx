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
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { StructuredReportWorkspace } from "@/components/reports/StructuredReportWorkspace";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mapTiradsAcrToSreInput } from "@/lib/reports/map-tirads-to-sre-input";
import {
  clearTiradsBridgePayload,
  loadTiradsBridgePayload,
} from "@/lib/reports/sre-tirads-bridge";

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
        className="clinical-form-control mt-1 w-full rounded-xl px-3 py-2"
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
        className="clinical-form-control mt-1 w-full rounded-xl px-3 py-2"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

type Props = {
  initialInput?: ThyroidStructuredReportInput;
};

function applySreToFormState(
  mapped: ThyroidStructuredReportInput,
  setters: {
    setComposition: (v: ThyroidStructuredReportInput["morphology"]["composition"]) => void;
    setEchogenicity: (v: ThyroidStructuredReportInput["morphology"]["echogenicity"]) => void;
    setShape: (v: ThyroidStructuredReportInput["morphology"]["shape"]) => void;
    setMargin: (v: ThyroidStructuredReportInput["morphology"]["margin"]) => void;
    setEchogenicFoci: (v: ThyroidStructuredReportInput["morphology"]["echogenicFoci"]) => void;
    setNoduleMm: (v: string) => void;
    setVolumeMl: (v: string) => void;
    setNoduleLocation: (v: string) => void;
    setFreeText: (v: string) => void;
  },
) {
  setters.setComposition(mapped.morphology.composition ?? "solid");
  setters.setEchogenicity(mapped.morphology.echogenicity ?? "hypoechoic");
  setters.setShape(mapped.morphology.shape ?? "wider_than_tall");
  setters.setMargin(mapped.morphology.margin ?? "smooth");
  setters.setEchogenicFoci(mapped.morphology.echogenicFoci ?? "none_or_comet_tail");
  setters.setNoduleMm(
    mapped.measurements.noduleMaxDiameterMm != null
      ? String(mapped.measurements.noduleMaxDiameterMm)
      : "",
  );
  setters.setVolumeMl(
    mapped.measurements.thyroidVolumeMl != null ? String(mapped.measurements.thyroidVolumeMl) : "",
  );
  setters.setNoduleLocation(mapped.morphology.noduleLocation ?? "");
  setters.setFreeText(mapped.freeTextFindings ?? "");
}

export function ThyroidReportWorkspace({ initialInput }: Props = {}) {
  const [fromBridge, setFromBridge] = useState(false);

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

  useEffect(() => {
    const setters = {
      setComposition,
      setEchogenicity,
      setShape,
      setMargin,
      setEchogenicFoci,
      setNoduleMm,
      setVolumeMl,
      setNoduleLocation,
      setFreeText,
    };
    if (initialInput) {
      applySreToFormState(initialInput, setters);
      return;
    }
    const bridge = loadTiradsBridgePayload();
    if (!bridge) return;
    applySreToFormState(mapTiradsAcrToSreInput(bridge.input, bridge.result), setters);
    setFromBridge(true);
    clearTiradsBridgePayload();
  }, [initialInput]);

  const formInput = useMemo((): ThyroidStructuredReportInput => {
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

  const effectiveInput = formInput;

  return (
    <StructuredReportWorkspace
      templateSlug={THYROID_TIRADS_V1_TEMPLATE_SLUG}
      title="Протокол · щитовидная · TI-RADS"
      description="ACR TI-RADS — описание, категория, рекомендации по ТАБ и наблюдению. Assistive-режим; не диагноз."
      input={effectiveInput}
      backHref="/tools/calc/rads/ti-rads"
      backLabel="← ACR TI-RADS"
      exportFilenameBase="sre-thyroid-tirads"
      exportTitle="Структурированный протокол · TI-RADS"
      formPanel={
        <Card className="border-[var(--clinical-border)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Признаки узла (ACR TI-RADS)</CardTitle>
            {fromBridge ? (
              <CardDescription>Подставлено из калькулятора ACR Score.</CardDescription>
            ) : null}
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SelectField
              label="Composition"
              value={composition ?? ""}
              options={COMPOSITION_OPTIONS.filter((o) => o.value !== "no_nodule")}
              onChange={setComposition}
            />
            <SelectField label="Echogenicity" value={echogenicity ?? ""} options={ECHOGENICITY_OPTIONS} onChange={setEchogenicity} />
            <SelectField label="Shape" value={shape ?? ""} options={SHAPE_OPTIONS} onChange={setShape} />
            <SelectField label="Margin" value={margin ?? ""} options={MARGIN_OPTIONS} onChange={setMargin} />
            <SelectField
              label="Echogenic foci (ведущий)"
              value={echogenicFoci ?? ""}
              options={ECHOGENIC_FOCI_OPTIONS}
              onChange={setEchogenicFoci}
            />
            <NumField label="Диаметр узла, мм" value={noduleMm} onChange={setNoduleMm} placeholder="12" />
            <NumField label="Объём ЩЖ, мл" value={volumeMl} onChange={setVolumeMl} placeholder="опционально" />
            <label className="block text-sm sm:col-span-2">
              <span className="font-medium">Локализация</span>
              <input
                className="clinical-form-control mt-1 w-full rounded-xl px-3 py-2"
                value={noduleLocation}
                onChange={(e) => setNoduleLocation(e.target.value)}
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
            <div className="sm:col-span-full">
              <Button asChild variant="outline" size="sm">
                <Link href="/tools/calc/rads/ti-rads">Открыть калькулятор ACR</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      }
    />
  );
}
