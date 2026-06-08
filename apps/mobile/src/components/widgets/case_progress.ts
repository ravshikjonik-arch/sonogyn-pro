import type { CasePreview } from "../../features/case/types";

type ProgressInfo = {
  percent: number;
  completed: number;
  total: number;
};

function hasAny(text: string, variants: string[]): boolean {
  return variants.some((v) => text.includes(v));
}

function hasValue(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim().length > 0;
  return true;
}

export function calcClinicalProgress(item: CasePreview): ProgressInfo {
  const snapshot = item.oradsSnapshot?.input;
  if (item.organ === "ovary" && snapshot) {
    const checks = [
      true,
      hasValue(snapshot.localization),
      hasValue(snapshot.menopause),
      hasValue(snapshot.lesionKind) && (hasValue(snapshot.structure) || hasValue(snapshot.unilocularSubtype)),
      hasValue(snapshot.bloodFlow) || snapshot.ascites === true || snapshot.peritonealNodules === true,
      hasValue(item.oradsSnapshot?.resultCategory) || hasAny((item.result || "").toLowerCase(), ["o-rads", "orads"]),
    ];
    const completed = checks.filter(Boolean).length;
    const total = checks.length;
    return { percent: Math.round((completed / total) * 100), completed, total };
  }

  const raw = `${item.description || ""} ${item.result || ""}`.toLowerCase();

  const checks = [
    true, // case created
    item.organ === "ovary" || hasAny(raw, ["овари", "аднекс", "локализац"]),
    hasAny(raw, ["менопауз", "pre", "post", "пременопауз", "постменопауз"]),
    hasAny(raw, ["кист", "солид", "перегород", "структур", "образован"]),
    hasAny(raw, ["кровоток", "color score", "pi", "допплер"]),
    hasAny(raw, ["o-rads", "orads", "категор", "заключени", "рекомендац"]),
  ];

  const completed = checks.filter(Boolean).length;
  const total = checks.length;
  const percent = Math.round((completed / total) * 100);
  return { percent, completed, total };
}
