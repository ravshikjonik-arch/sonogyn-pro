"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import type { BreastAiAssistResult } from "@/lib/ai/breast-ultrasound-assist";
import {
  defaultBiradsBrochureInput,
  mergeParsedBiradsInput,
  presetForPathology,
  type BiradsBrochureInput,
  type NlpAssistResult,
} from "@/lib/birads-us";

export type BiradsFlowMode = "quick" | "brochure" | "atlas" | "assistant";

type ApplySource = {
  label: string;
  mergedText?: string;
};

type BiradsFlowContextValue = {
  input: BiradsBrochureInput;
  setInput: React.Dispatch<React.SetStateAction<BiradsBrochureInput>>;
  quickStep: number;
  setQuickStep: React.Dispatch<React.SetStateAction<number>>;
  brochureStep: number;
  setBrochureStep: React.Dispatch<React.SetStateAction<number>>;
  applySource: ApplySource | null;
  applyFromAi: (result: BreastAiAssistResult | NlpAssistResult, target: "quick" | "brochure") => void;
  applyPathologyPreset: (pathologyId: string, target?: "quick" | "brochure") => void;
  setMode: (mode: BiradsFlowMode) => void;
};

const BiradsFlowContext = createContext<BiradsFlowContextValue | null>(null);

export function useBiradsFlow() {
  const ctx = useContext(BiradsFlowContext);
  if (!ctx) throw new Error("useBiradsFlow must be used within BiradsFlowProvider");
  return ctx;
}

export function BiradsFlowProvider({
  children,
  setMode,
}: {
  children: ReactNode;
  setMode: (mode: BiradsFlowMode) => void;
}) {
  const [input, setInput] = useState<BiradsBrochureInput>({ ...defaultBiradsBrochureInput });
  const [quickStep, setQuickStep] = useState(1);
  const [brochureStep, setBrochureStep] = useState(1);
  const [applySource, setApplySource] = useState<ApplySource | null>(null);

  const applyFromAi = useCallback(
    (result: BreastAiAssistResult | NlpAssistResult, target: "quick" | "brochure") => {
      const merged = mergeParsedBiradsInput(result.parsedInput, input);
      if ("mergedText" in result && result.mergedText?.trim()) {
        merged.localizationText = result.mergedText.slice(0, 500);
      }
      setInput(merged);
      setApplySource({
        label: result.suggestedDiagnosis,
        mergedText: "mergedText" in result ? result.mergedText : undefined,
      });
      setMode(target);
      if (target === "quick") setQuickStep(5);
      else setBrochureStep(8);
      toast.success(`Применено: ${result.suggestedDiagnosis} → ${target === "quick" ? "быстрый" : "брошюра"}`);
    },
    [input, setMode],
  );

  const applyPathologyPreset = useCallback(
    (pathologyId: string, target: "quick" | "brochure" = "quick") => {
      const preset = presetForPathology(pathologyId);
      if (!preset) {
        toast.error("Шаблон для этой патологии не найден");
        return;
      }
      const { localizationText, ...fields } = preset;
      const merged = mergeParsedBiradsInput(fields, input);
      if (localizationText) merged.localizationText = localizationText;
      setInput(merged);
      setApplySource({ label: `Шаблон: ${pathologyId}` });
      setMode(target);
      if (target === "quick") setQuickStep(2);
      else setBrochureStep(2);
      toast.success("Шаблон патологии применён — проверьте поля");
    },
    [input, setMode],
  );

  const value = useMemo(
    () => ({
      input,
      setInput,
      quickStep,
      setQuickStep,
      brochureStep,
      setBrochureStep,
      applySource,
      applyFromAi,
      applyPathologyPreset,
      setMode,
    }),
    [input, quickStep, brochureStep, applySource, applyFromAi, applyPathologyPreset, setMode],
  );

  return <BiradsFlowContext.Provider value={value}>{children}</BiradsFlowContext.Provider>;
}

/** Optional hook when component may render outside provider (standalone brochure page). */
export function useBiradsFlowOptional() {
  return useContext(BiradsFlowContext);
}
