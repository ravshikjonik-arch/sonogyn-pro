"use client";

import { createContext, useContext, type ReactNode } from "react";

import {
  useOradsProFormState,
  type OradsProForm,
} from "@/components/calculators/orads/useOradsProForm";

const OradsProFormContext = createContext<OradsProForm | null>(null);

export function OradsProFormProvider({ children }: { children: ReactNode }) {
  const value = useOradsProFormState();
  return <OradsProFormContext.Provider value={value}>{children}</OradsProFormContext.Provider>;
}

export function useOradsProForm(): OradsProForm {
  const ctx = useContext(OradsProFormContext);
  if (!ctx) {
    throw new Error("useOradsProForm must be used within OradsProFormProvider");
  }
  return ctx;
}
