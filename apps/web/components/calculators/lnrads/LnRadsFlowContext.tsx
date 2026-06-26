"use client";

import { createContext, useContext, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

import { defaultLnRadsInput, type LnRadsInput } from "@/lib/ln-rads-us";

export type LnRadsMode =
  | "calculator"
  | "atlas"
  | "academy"
  | "assistant"
  | "anatomy"
  | "cases"
  | "board"
  | "reports";

type LnRadsFlowContextValue = {
  input: LnRadsInput;
  setInput: Dispatch<SetStateAction<LnRadsInput>>;
  step: number;
  setStep: (n: number) => void;
  mode: LnRadsMode;
  setMode: (m: LnRadsMode) => void;
};

const LnRadsFlowContext = createContext<LnRadsFlowContextValue | null>(null);

export function LnRadsFlowProvider({
  children,
  setMode: setModeExternal,
}: {
  children: ReactNode;
  setMode: (m: LnRadsMode) => void;
}) {
  const [input, setInput] = useState<LnRadsInput>(() => defaultLnRadsInput());
  const [step, setStep] = useState(1);
  const [mode, setModeInternal] = useState<LnRadsMode>("calculator");

  const setMode = (m: LnRadsMode) => {
    setModeInternal(m);
    setModeExternal(m);
  };

  const value = useMemo(
    () => ({ input, setInput, step, setStep, mode, setMode }),
    [input, step, mode],
  );

  return <LnRadsFlowContext.Provider value={value}>{children}</LnRadsFlowContext.Provider>;
}

export function useLnRadsFlow() {
  const ctx = useContext(LnRadsFlowContext);
  if (!ctx) throw new Error("useLnRadsFlow must be used within LnRadsFlowProvider");
  return ctx;
}
