import type { LesionKind, Structure, UnilocularSubtype } from "@/lib/orads-pro";

/** Не показываем категорию, пока дерево не собрано — иначе engine даёт «тихий» O-RADS 3. */
export function isOradsFeatureResultReady(input: {
  menopause?: "pre" | "post";
  lesionKind?: LesionKind;
  physType?: "follicle" | "corpus_luteum";
  structure?: Structure;
  unilocularSubtype?: UnilocularSubtype;
  septaThickness?: "thin" | "thick";
  solidComponent?: boolean;
  solidType?: "smooth" | "irregular" | "papillary";
}): boolean {
  if (!input.menopause || !input.lesionKind) return false;
  if (input.lesionKind === "normal_ovary") return true;
  if (input.lesionKind === "physiological") return Boolean(input.physType);
  if (input.lesionKind !== "nonphysiological") return false;
  if (!input.structure) return false;
  if (input.structure === "unilocular") return Boolean(input.unilocularSubtype);
  if (input.structure === "multilocular") {
    return input.septaThickness != null || input.solidComponent != null;
  }
  return Boolean(input.solidType);
}
