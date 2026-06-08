"use client";

import { useCallback, useMemo, useState } from "react";

import type {
  ElastographyCalculatorResult,
  ElastographyMethod,
  ElastographyOrgan,
  MyometriumLesionType,
  OvaryIotaType,
} from "@repo/medical-calculations/elastography";

import { ORGAN_FIELD_DEFINITIONS, ORGAN_METHODS } from "@/lib/calculators/elastography/fieldDefinitions";
import { ElastographyInputError, runWebElastography } from "@/lib/calculators/elastography/runCalculation";

export type ElastographyStep = "organ" | "method" | "input" | "result";

function parseNumeric(values: Record<string, string>, key: string): number | undefined {
  const raw = values[key]?.trim();
  if (!raw) return undefined;
  const n = Number(raw.replace(",", "."));
  return Number.isNaN(n) ? undefined : n;
}

function validateFields(
  fields: { key: string; label: string; min: number; max: number; optional?: boolean }[],
  values: Record<string, string>,
): string[] {
  const errors: string[] = [];
  for (const f of fields) {
    const raw = values[f.key]?.trim() ?? "";
    if (!raw) {
      if (!f.optional) errors.push(`«${f.label}» — обязательное поле`);
      continue;
    }
    const n = Number(raw.replace(",", "."));
    if (Number.isNaN(n)) {
      errors.push(`«${f.label}» — введите число`);
      continue;
    }
    if (n < f.min || n > f.max) {
      errors.push(`«${f.label}» — допустимо ${f.min}–${f.max}`);
    }
  }
  return errors;
}

export function useElastographyWeb() {
  const [step, setStep] = useState<ElastographyStep>("organ");
  const [organ, setOrgan] = useState<Exclude<ElastographyOrgan, "abdomen_liver"> | null>(null);
  const [method, setMethod] = useState<ElastographyMethod | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [myometriumType, setMyometriumType] = useState<MyometriumLesionType>("unclear");
  const [ovaryIotaType, setOvaryIotaType] = useState<OvaryIotaType>("cyst");
  const [patientName, setPatientName] = useState("");
  const [result, setResult] = useState<ElastographyCalculatorResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const availableMethods = useMemo(() => (organ ? ORGAN_METHODS[organ] : []), [organ]);

  const fields = useMemo(() => {
    if (!organ || !method) return [];
    return ORGAN_FIELD_DEFINITIONS[organ][method] ?? [];
  }, [organ, method]);

  const selectOrgan = useCallback((o: Exclude<ElastographyOrgan, "abdomen_liver">) => {
    const methods = ORGAN_METHODS[o];
    setOrgan(o);
    setMethod(methods.length === 1 ? methods[0] : null);
    setValues({});
    setResult(null);
    setValidationErrors([]);
    setStep(methods.length === 1 ? "input" : "method");
  }, []);

  const selectMethod = useCallback((m: ElastographyMethod) => {
    setMethod(m);
    setValues({});
    setResult(null);
    setValidationErrors([]);
    setStep("input");
  }, []);

  const setField = useCallback((key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  }, []);

  const calculate = useCallback(() => {
    if (!organ || !method) return;
    const errors = validateFields(fields, values);
    setValidationErrors(errors);
    if (errors.length) return;

    try {
      let calcResult: ElastographyCalculatorResult;
      if (organ === "cervix") {
        calcResult = runWebElastography({
          organ: "cervix",
          data: {
            internalOsStiffness: parseNumeric(values, "internalOsStiffness") ?? 0,
            externalOsStiffness: parseNumeric(values, "externalOsStiffness") ?? 0,
            gestationalWeeks: parseNumeric(values, "gestationalWeeks"),
          },
        });
      } else if (organ === "myometrium") {
        calcResult = runWebElastography({
          organ: "myometrium",
          data: {
            lesionYoungModulusKpa: parseNumeric(values, "lesionYoungModulusKpa") ?? 0,
            referenceMyometriumKpa: parseNumeric(values, "referenceMyometriumKpa") ?? 0,
            lesionType: myometriumType,
          },
        });
      } else if (organ === "ovary") {
        calcResult = runWebElastography({
          organ: "ovary",
          data: {
            strainRatio: parseNumeric(values, "strainRatio"),
            youngModulusKpa: parseNumeric(values, "youngModulusKpa"),
            iotaType: ovaryIotaType,
            method,
          },
        });
      } else {
        calcResult = runWebElastography({
          organ: "breast",
          data: {
            tsukubaScore: parseNumeric(values, "tsukubaScore"),
            strainRatio: parseNumeric(values, "strainRatio"),
            emaxKpa: parseNumeric(values, "emaxKpa"),
            lesionSizeMm: parseNumeric(values, "lesionSizeMm"),
            lesionDepthMm: parseNumeric(values, "lesionDepthMm"),
            method,
          },
        });
      }
      setResult(calcResult);
      setStep("result");
    } catch (e) {
      if (e instanceof ElastographyInputError) {
        setValidationErrors([e.message]);
        return;
      }
      throw e;
    }
  }, [organ, method, fields, values, myometriumType, ovaryIotaType]);

  const goBack = useCallback(() => {
    if (step === "result") setStep("input");
    else if (step === "input") setStep(method && availableMethods.length > 1 ? "method" : "organ");
    else if (step === "method") setStep("organ");
  }, [step, method, availableMethods.length]);

  const reset = useCallback(() => {
    setStep("organ");
    setOrgan(null);
    setMethod(null);
    setValues({});
    setResult(null);
    setValidationErrors([]);
  }, []);

  return {
    step,
    organ,
    method,
    values,
    fields,
    availableMethods,
    myometriumType,
    setMyometriumType,
    ovaryIotaType,
    setOvaryIotaType,
    patientName,
    setPatientName,
    result,
    validationErrors,
    selectOrgan,
    selectMethod,
    setField,
    calculate,
    goBack,
    reset,
  };
}
