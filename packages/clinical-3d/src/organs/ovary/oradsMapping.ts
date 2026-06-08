/**
 * O-RADS US v2022 — категории риска для овариальных образований.
 * ACR O-RADS Ultrasound v2022.
 * @see https://www.acr.org/Clinical-Resources/Reporting-and-Data-Systems/O-RADS
 */

export type OradsCategory = 1 | 2 | 3 | 4 | 5;

export const ORADS_LABELS_RU: Record<OradsCategory, string> = {
  1: "O-RADS 1 — физиологическое",
  2: "O-RADS 2 — почти наверняка доброкачественное",
  3: "O-RADS 3 — низкий риск",
  4: "O-RADS 4 — промежуточный риск",
  5: "O-RADS 5 — высокий риск",
};

export const ORADS_COLORS: Record<OradsCategory, string> = {
  1: "#4CAF50",
  2: "#8BC34A",
  3: "#FFC107",
  4: "#FF9800",
  5: "#F44336",
};

export function getOradsColor(category: OradsCategory): string {
  return ORADS_COLORS[category];
}

export function suggestOradsFromIota(iota: "B" | "M" | "U"): OradsCategory | null {
  if (iota === "B") return 2;
  if (iota === "M") return 5;
  return null;
}
