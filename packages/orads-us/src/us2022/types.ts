/** ACR O-RADS US v2022 — grid-aligned input (Kimi / ACR lexicon). */
export type MenopauseUs2022 = "" | "pre" | "postEarly" | "postLate";
/** Клинический контекст пременопаузы; на категорию O-RADS v2022 не влияет. */
export type CycleRegularityUs2022 = "" | "regular" | "irregular";
export type MorphologyUs2022 =
  | ""
  | "normal"
  | "classic"
  | "unilocular"
  | "bilocular"
  | "multilocular"
  | "solid";
export type ClassicTypeUs2022 =
  | ""
  | "dermoid"
  | "endometrioma"
  | "hemorrhagic"
  | "paraovarian"
  | "peritoneal"
  | "hydrosalpinx";
export type ColorScoreUs2022 = 1 | 2 | 3 | 4;

export interface OradsUs2022Input {
  incomplete: boolean;
  menopause: MenopauseUs2022;
  /** Только при menopause=pre — для протокола / анамнеза. */
  cycleRegularity: CycleRegularityUs2022;
  morphology: MorphologyUs2022;
  classicType: ClassicTypeUs2022;
  sizeCm: number | null;
  cystContent: "simple" | "nonSimple";
  innerContour: "smooth" | "irregular";
  solidComponent: boolean;
  papillae: "0" | "1-3" | "4+";
  colorScore: ColorScoreUs2022 | null;
  shadowing: boolean;
  outerContour: "smooth" | "irregular";
  extraSigns: "none" | "ascites" | "peritoneal";
}

export interface OradsUs2022Result {
  category: 0 | 1 | 2 | 3 | 4 | 5 | null;
  risk: string;
  title: string;
  rationale: string;
  management: string;
  missing: string[];
  warning?: string;
}

export const initialOradsUs2022Input: OradsUs2022Input = {
  incomplete: false,
  menopause: "",
  cycleRegularity: "",
  morphology: "",
  classicType: "",
  sizeCm: null,
  cystContent: "simple",
  innerContour: "smooth",
  solidComponent: false,
  papillae: "0",
  colorScore: null,
  shadowing: false,
  outerContour: "smooth",
  extraSigns: "none",
};
