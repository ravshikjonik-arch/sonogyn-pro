import type { BethesdaResultSchema, Cytology, HpvTest, IfcpcColposcopy } from "../domain/schemas";
import type { z } from "zod";

export type BethesdaTriage = {
  summary: string;
  colposcopyIndicated: boolean;
  biopsyThreshold: "none" | "ifcpc_major" | "mandatory";
  evidence: string[];
};

type Bethesda = z.infer<typeof BethesdaResultSchema>;

/** Part 3 — Bethesda + HPV + IFCPC triage matrix (ASCCP-aligned). */
export function evaluateBethesdaTriage(
  cytology: Cytology,
  hpv: HpvTest,
  colposcopy: IfcpcColposcopy,
): BethesdaTriage {
  const evidence: string[] = [];
  const grade2Ids = new Set([
    "dense_acetowhite",
    "coarse_mosaic",
    "coarse_punctation",
    "sharp_border",
    "inner_border_sign",
    "ridge_sign",
    "cuffed_crypt_orifices",
  ]);
  const hasMajor = colposcopy.findingSignIds.some((id) => grade2Ids.has(id));
  const hpvPos = hpv.status === "positive";

  const matrix: Record<Bethesda, Omit<BethesdaTriage, "evidence">> = {
    nilm: {
      summary: hpvPos ? "NILM/HPV+ — repeat HPV/co-test" : "NILM/HPV− — routine screening",
      colposcopyIndicated: hpvPos,
      biopsyThreshold: "ifcpc_major",
    },
    ascus: {
      summary: hpvPos ? "ASC-US/HPV+ → colposcopy" : "ASC-US/HPV− → repeat 3–5y",
      colposcopyIndicated: hpvPos,
      biopsyThreshold: "ifcpc_major",
    },
    lsil: {
      summary: hpvPos ? "LSIL — colposcopy" : "LSIL/HPV− — observation",
      colposcopyIndicated: true,
      biopsyThreshold: "ifcpc_major",
    },
    asc_h: {
      summary: "ASC-H — colposcopy + biopsy if major",
      colposcopyIndicated: true,
      biopsyThreshold: "mandatory",
    },
    hsil: {
      summary: "HSIL — colposcopy + biopsy",
      colposcopyIndicated: true,
      biopsyThreshold: "mandatory",
    },
    agc: {
      summary: "AGC — colposcopy + ECC + excision pathway",
      colposcopyIndicated: true,
      biopsyThreshold: "mandatory",
    },
    ais: {
      summary: "AIS — excision mandatory",
      colposcopyIndicated: true,
      biopsyThreshold: "mandatory",
    },
    scc: {
      summary: "SCC cytology — urgent oncology",
      colposcopyIndicated: true,
      biopsyThreshold: "mandatory",
    },
    unsatisfactory: {
      summary: "Unsatisfactory — repeat cytology 2–4 months",
      colposcopyIndicated: false,
      biopsyThreshold: "none",
    },
  };

  const base = matrix[cytology.result];
  evidence.push(`Bethesda ${cytology.result.toUpperCase()}: ${base.summary}`);
  if (hasMajor) evidence.push("IFCPC major present — lowers biopsy threshold.");

  return {
    ...base,
    biopsyThreshold: hasMajor && base.biopsyThreshold !== "mandatory" ? "mandatory" : base.biopsyThreshold,
    evidence,
  };
}
