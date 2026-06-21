"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import {
  defaultTiradsAcrInput,
  mergeTiradsInput,
  patternById,
  type TiradsAcrInput,
  type TiradsNlpResult,
} from "@/lib/tirads-acr";

export type TiradsProMode = "acr" | "patterns" | "assistant" | "education" | "ru";

type TiradsFlowContextValue = {
  input: TiradsAcrInput;
  setInput: React.Dispatch<React.SetStateAction<TiradsAcrInput>>;
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  applySource: string | null;
  applyPattern: (patternId: string) => void;
  applyFromAi: (result: TiradsNlpResult) => void;
  setMode: (mode: TiradsProMode) => void;
};

const TiradsFlowContext = createContext<TiradsFlowContextValue | null>(null);

export function useTiradsFlow() {
  const ctx = useContext(TiradsFlowContext);
  if (!ctx) throw new Error("useTiradsFlow required");
  return ctx;
}

export function TiradsFlowProvider({
  children,
  setMode,
}: {
  children: ReactNode;
  setMode: (mode: TiradsProMode) => void;
}) {
  const [input, setInput] = useState<TiradsAcrInput>({ ...defaultTiradsAcrInput });
  const [step, setStep] = useState(1);
  const [applySource, setApplySource] = useState<string | null>(null);

  const applyPattern = useCallback(
    (patternId: string) => {
      const p = patternById(patternId);
      if (!p) return;
      setInput(mergeTiradsInput({ ...p.preset, patternId: p.id }, input));
      setApplySource(p.nameRu);
      setMode("acr");
      setStep(7);
      toast.success(`Паттерн: ${p.nameRu}`);
    },
    [input, setMode],
  );

  const applyFromAi = useCallback(
    (result: TiradsNlpResult) => {
      setInput(result.parsedInput);
      setApplySource(result.suggestedDiagnosis);
      setMode("acr");
      setStep(7);
      toast.success("AI → калькulator ACR");
    },
    [setMode],
  );

  const value = useMemo(
    () => ({ input, setInput, step, setStep, applySource, applyPattern, applyFromAi, setMode }),
    [input, step, applySource, applyPattern, applyFromAi, setMode],
  );

  return <TiradsFlowContext.Provider value={value}>{children}</TiradsFlowContext.Provider>;
}
