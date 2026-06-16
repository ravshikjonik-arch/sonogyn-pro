/** МКБ и маршруты, связанные с пролапсом / POP-Q. */

export const POP_Q_CALCULATOR_HREF = "/calculators/pop-q";
export const PROLAPSE_CASES_HREF = "/cases?tab=cases&topic=prolapse";
export const PROLAPSE_ASSISTANT_HREF = "/assistant/gynecology?q=N81";

const PROLAPSE_CODE_PREFIXES = ["N81", "N99.3"] as const;

export function isProlapseNosologyCode(code: string): boolean {
  const normalized = code.trim().toUpperCase();
  return PROLAPSE_CODE_PREFIXES.some(
    (p) => normalized === p || normalized.startsWith(`${p}.`) || normalized.startsWith(p),
  );
}

export function isProlapseTeachingCase(row: {
  title: string;
  description: string | null;
  anatomy: string | null;
  pathology: string | null;
}): boolean {
  const blob = `${row.title} ${row.description ?? ""} ${row.anatomy ?? ""} ${row.pathology ?? ""}`.toLowerCase();
  return /pop-q|popq|пролапс|выпад|опущ|n81|n99\.3|pelvic|тазовое дно|цистоцеле|ректоцеле/.test(blob);
}

export function buildPopQCaseTitle(stageText: string, compartment?: string): string {
  return compartment ? `POP-Q ${stageText} · ${compartment}` : `POP-Q ${stageText} · разбор`;
}
