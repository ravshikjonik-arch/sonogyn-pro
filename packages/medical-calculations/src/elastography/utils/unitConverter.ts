import type { ShearWaveVendor } from "../types";

const RHO_SOFT_TISSUE = 1000;

/** Vendor-specific поправки к формуле E = 3ρVs² */
export const VENDOR_SWE_COEFFICIENT: Record<ShearWaveVendor, number> = {
  generic: 1,
  siemens: 1,
  supersonic: 0.98,
  ge: 1.02,
  canon: 1,
};

/** кПа → м/с: Vs = sqrt(E / (3 × ρ)) с учётом вендора */
export function kpaToMs(kpa: number, vendor: ShearWaveVendor = "generic"): number {
  if (kpa <= 0) return 0;
  const e = kpa * 1000 * VENDOR_SWE_COEFFICIENT[vendor];
  const vs = Math.sqrt(e / (3 * RHO_SOFT_TISSUE));
  return Math.round(vs * 100) / 100;
}

/** м/с → кПа: E = 3 × ρ × Vs² */
export function msToKpa(ms: number, vendor: ShearWaveVendor = "generic"): number {
  if (ms <= 0) return 0;
  const ePa = 3 * RHO_SOFT_TISSUE * ms * ms;
  const kpa = ePa / 1000 / VENDOR_SWE_COEFFICIENT[vendor];
  return Math.round(kpa * 10) / 10;
}

export function formatKpaMsPair(kpa: number, vendor: ShearWaveVendor = "generic"): string {
  const ms = kpaToMs(kpa, vendor);
  return `${kpa.toFixed(1)} кПа ≈ ${ms.toFixed(2)} м/с`;
}
