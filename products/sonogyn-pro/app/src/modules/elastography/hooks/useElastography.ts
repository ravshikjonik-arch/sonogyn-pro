import { useCallback, useEffect, useMemo, useState } from "react";
import i18n from "../../../i18n";
import { getConfig, ORGAN_FIELD_DEFINITIONS, ORGAN_METHODS } from "../constants";
import { ElastographyInputError, runElastographyCalculator } from "../calculators";
import { elastoT } from "../i18nStrings";
import type {
  ElastographyCalculatorResult,
  ElastographyHistoryEntry,
  ElastographyMethod,
  ElastographyOrgan,
  ElastographyWizardStep,
  MyometriumLesionType,
  OvaryIotaType,
} from "../types";
import { parseNumeric, validateAllFields } from "../utils/validators";
import { createHistoryId, saveElastographyEntry } from "../utils/historyStorage";

export function useElastography() {
  const locale = i18n.locale as "ru" | "en" | "es";
  const t = useCallback((key: string) => elastoT(key, locale), [locale]);

  const [step, setStep] = useState<ElastographyWizardStep>("organ");
  const [organ, setOrgan] = useState<ElastographyOrgan | null>(null);
  const [method, setMethod] = useState<ElastographyMethod | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [myometriumType, setMyometriumType] = useState<MyometriumLesionType>("unclear");
  const [ovaryIotaType, setOvaryIotaType] = useState<OvaryIotaType>("cyst");
  const [patientId, setPatientId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [result, setResult] = useState<ElastographyCalculatorResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [configReady, setConfigReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getConfig()
      .then(() => {
        if (!cancelled) setConfigReady(true);
      })
      .catch(() => {
        if (!cancelled) setConfigReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeOrgan = organ && organ !== "abdomen_liver" ? organ : null;

  const availableMethods = useMemo(() => {
    if (!activeOrgan) return [];
    return ORGAN_METHODS[activeOrgan];
  }, [activeOrgan]);

  const fields = useMemo(() => {
    if (!activeOrgan || !method) return [];
    return ORGAN_FIELD_DEFINITIONS[activeOrgan][method] ?? [];
  }, [activeOrgan, method]);

  const selectOrgan = useCallback((o: ElastographyOrgan) => {
    if (o === "abdomen_liver") return;
    setOrgan(o);
    const methods = ORGAN_METHODS[o];
    setMethod(methods.length === 1 ? methods[0] : null);
    setValues({});
    setResult(null);
    setStep(methods.length === 1 ? "input" : "method");
  }, []);

  const selectMethod = useCallback((m: ElastographyMethod) => {
    setMethod(m);
    setValues({});
    setResult(null);
    setStep("input");
  }, []);

  const setField = useCallback((key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  }, []);

  const calculate = useCallback(() => {
    if (!activeOrgan || !method || !configReady) return;
    const issues = validateAllFields(fields, values);
    const errors = issues.filter((i) => i.severity === "error").map((i) => t(i.messageKey));
    const warns = issues.filter((i) => i.severity === "warning").map((i) => t(i.messageKey));
    setValidationErrors(errors);
    setWarnings(warns);
    if (errors.length) return;

    try {
      let calcResult: ElastographyCalculatorResult;
      if (activeOrgan === "cervix") {
        calcResult = runElastographyCalculator({
          organ: "cervix",
          data: {
            internalOsStiffness: parseNumeric(values, "internalOsStiffness") ?? 0,
            externalOsStiffness: parseNumeric(values, "externalOsStiffness") ?? 0,
            gestationalWeeks: parseNumeric(values, "gestationalWeeks"),
          },
        });
      } else if (activeOrgan === "myometrium") {
        calcResult = runElastographyCalculator({
          organ: "myometrium",
          data: {
            lesionYoungModulusKpa: parseNumeric(values, "lesionYoungModulusKpa") ?? 0,
            referenceMyometriumKpa: parseNumeric(values, "referenceMyometriumKpa") ?? 0,
            lesionType: myometriumType,
          },
        });
      } else if (activeOrgan === "ovary") {
        calcResult = runElastographyCalculator({
          organ: "ovary",
          data: {
            strainRatio: parseNumeric(values, "strainRatio"),
            youngModulusKpa: parseNumeric(values, "youngModulusKpa"),
            iotaType: ovaryIotaType,
            method,
          },
        });
      } else {
        calcResult = runElastographyCalculator({
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
  }, [activeOrgan, method, fields, values, myometriumType, ovaryIotaType, t, configReady]);

  const getCurrentHistoryEntry = useCallback((): ElastographyHistoryEntry | null => {
    if (!result || !activeOrgan || !method) return null;
    return {
      id: createHistoryId(),
      createdAt: Date.now(),
      patientId: patientId || undefined,
      patientName: patientName || undefined,
      organ: activeOrgan,
      method,
      input: { ...values, myometriumType, ovaryIotaType },
      result,
    };
  }, [result, activeOrgan, method, values, myometriumType, ovaryIotaType, patientId, patientName]);

  const saveToHistory = useCallback(async () => {
    const entry = getCurrentHistoryEntry();
    if (!entry) return false;
    try {
      await saveElastographyEntry(entry);
      return true;
    } catch {
      return false;
    }
  }, [getCurrentHistoryEntry]);

  const reset = useCallback(() => {
    setStep("organ");
    setOrgan(null);
    setMethod(null);
    setValues({});
    setResult(null);
    setValidationErrors([]);
    setWarnings([]);
  }, []);

  const goBack = useCallback(() => {
    if (step === "result") setStep("input");
    else if (step === "input") setStep(method && availableMethods.length > 1 ? "method" : "organ");
    else if (step === "method") setStep("organ");
  }, [step, method, availableMethods.length]);

  return {
    t,
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
    patientId,
    setPatientId,
    patientName,
    setPatientName,
    result,
    validationErrors,
    warnings,
    configReady,
    selectOrgan,
    selectMethod,
    setField,
    calculate,
    saveToHistory,
    getCurrentHistoryEntry,
    reset,
    goBack,
    setStep,
  };
}
