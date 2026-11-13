import type { MorphologyObservation, MorphologyValue } from "../types";

export const T = "2026-11-06T09:00:00.000Z";

let seq = 0;

/** Physician-confirmed observation builder for tests. */
export function obs(
  feature: string,
  anatomy: MorphologyObservation["anatomy"],
  value: MorphologyValue | null,
  extra: Partial<MorphologyObservation> = {},
): MorphologyObservation {
  seq += 1;
  return {
    id: `t${seq}`,
    anatomy,
    feature,
    value,
    status: "confirmed",
    source: "physician_input",
    timestamp: T,
    ...extra,
  };
}

export const e = (code: string): MorphologyValue => ({ kind: "enum", code });
export const b = (present: boolean): MorphologyValue => ({ kind: "boolean", present });
export const set = (...codes: string[]): MorphologyValue => ({ kind: "enum_set", codes });
export const mm = (feature: string, anatomy: MorphologyObservation["anatomy"], value: number, extra: Partial<MorphologyObservation> = {}) =>
  obs(feature, anatomy, null, { measurement: value, unit: "mm", ...extra });
