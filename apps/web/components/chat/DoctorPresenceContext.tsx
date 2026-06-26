"use client";

import { createContext, useContext, type ReactNode } from "react";

import { useDoctorPresence } from "@/hooks/useDoctorPresence";

type DoctorPresenceValue = ReturnType<typeof useDoctorPresence>;

const DoctorPresenceContext = createContext<DoctorPresenceValue | null>(null);

/** Single Realtime subscription for doctor_presence (avoid duplicate channels on /cases). */
export function DoctorPresenceProvider({ children }: { children: ReactNode }) {
  const value = useDoctorPresence();
  return <DoctorPresenceContext.Provider value={value}>{children}</DoctorPresenceContext.Provider>;
}

export function useDoctorPresenceContext(): DoctorPresenceValue {
  const ctx = useContext(DoctorPresenceContext);
  if (!ctx) {
    throw new Error("useDoctorPresenceContext must be used within DoctorPresenceProvider");
  }
  return ctx;
}
