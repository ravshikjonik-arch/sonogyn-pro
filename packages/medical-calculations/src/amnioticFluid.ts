/**
 * Amniotic fluid index (AFI) and single deepest pocket (SDP).
 *
 * Reference: Phelan JP et al. Amniotic fluid index measurements during pregnancy.
 * J Reprod Med. 1987;32(8):601-604.
 */

/** AFI = sum of four quadrant depths (cm). Normal orienting range ~8–24 cm (context-dependent). */
export function calculateAfi(quadrantsCm: [number, number, number, number]): number | null {
  if (quadrantsCm.some((q) => !Number.isFinite(q) || q < 0)) return null;
  return Math.round(quadrantsCm.reduce((a, b) => a + b, 0) * 10) / 10;
}

export type AfiInterpretation = "oligohydramnios" | "normal" | "polyhydramnios" | "unknown";

/** Simplified thresholds — always correlate with local protocol. */
export function interpretAfi(afiCm: number): AfiInterpretation {
  if (!Number.isFinite(afiCm)) return "unknown";
  if (afiCm < 5) return "oligohydramnios";
  if (afiCm > 24) return "polyhydramnios";
  return "normal";
}

export function interpretAfiRu(afiCm: number): string {
  switch (interpretAfi(afiCm)) {
    case "oligohydramnios":
      return "Олигогидрамнион (AFI < 5 см) — ориентир, уточните по протоколу";
    case "polyhydramnios":
      return "Поли гидрамнион (AFI > 24 см) — ориентир";
    case "normal":
      return "AFI в пределах ориентиров (5–24 см)";
    default:
      return "Недостаточно данных";
  }
}

/** Single deepest vertical pocket (cm). */
export function interpretSdpCm(sdpCm: number): string {
  if (!Number.isFinite(sdpCm)) return "—";
  if (sdpCm < 2) return "Мало вод (SDP < 2 см) — ориентир";
  if (sdpCm > 8) return "Много вод (SDP > 8 см) — ориентир";
  return "SDP в пределах ориентиров (2–8 см)";
}
