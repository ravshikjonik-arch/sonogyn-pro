import type { OradsExtractedInput } from "@repo/orads-us";

import type { MorphologyObservation } from "../types";
import type { ExtractionAmbiguity, ExtractionSubject } from "./types";

const ECHO: Record<string, string> = { anechoic: "anechoic", hypo: "hypoechoic", hyper: "hyperechoic" };

function valuesOf(observations: readonly MorphologyObservation[], feature: string): unknown[] {
  return observations
    .filter((o) => o.feature === feature && o.value)
    .map((o) => {
      const v = o.value!;
      return v.kind === "boolean" ? v.present : v.kind === "enum" ? v.code : undefined;
    });
}

/**
 * Compares LLM-derived observations with the existing rule parser (`parseOradsProtocolText`).
 * The parser is only a second opinion: it never creates observations (it infers defaults
 * from absence and keeps no spans). Disagreements become ambiguities for the physician.
 */
export function crossCheckWithOradsRuleParse(
  observations: readonly MorphologyObservation[],
  subjects: readonly ExtractionSubject[],
  parsed: OradsExtractedInput,
): ExtractionAmbiguity[] {
  if (!subjects.some((s) => s.site === "ovary" || s.site === "adnexa" || s.site === "fallopian_tube")) return [];
  const out: ExtractionAmbiguity[] = [];

  const compare = (feature: string, ruleValue: unknown, label: string) => {
    if (ruleValue === undefined) return;
    const ours = valuesOf(observations, feature);
    if (!ours.length) {
      out.push({
        kind: "rule_parser_found_unextracted",
        featureId: feature,
        detail: `Rule parser reads ${label}=${String(ruleValue)}; AI extraction has no observation — verify in the text`,
      });
    } else if (!ours.includes(ruleValue)) {
      out.push({
        kind: "rule_parser_disagreement",
        featureId: feature,
        detail: `Rule parser reads ${label}=${String(ruleValue)}; AI extraction: ${ours.map(String).join(", ")}`,
      });
    }
  };

  compare("adnexa.solid_component", parsed.solidComponent, "solidComponent");
  compare("adnexa.cyst_content_echogenicity", parsed.echogenicity ? ECHO[parsed.echogenicity] : undefined, "echogenicity");
  compare("adnexa.septa_thickness", parsed.septations === "thin" || parsed.septations === "thick" ? parsed.septations : undefined, "septations");
  compare("pelvis.ascites", parsed.ascites === undefined ? undefined : parsed.ascites === "present", "ascites");

  if (parsed.ovarySide === "left" || parsed.ovarySide === "right") {
    const sides = subjects.map((s) => s.laterality).filter(Boolean);
    if (!sides.includes(parsed.ovarySide) && !sides.includes("bilateral")) {
      out.push({
        kind: "rule_parser_disagreement",
        detail: `Rule parser reads ovarySide=${parsed.ovarySide}; AI subjects: ${sides.join(", ") || "no laterality"}`,
      });
    }
  }
  return out;
}
