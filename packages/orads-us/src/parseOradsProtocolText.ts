/**
 * Rule-first extraction of O-RADS-relevant features from Russian US protocol fragments.
 * Shared by web, mobile, and protocol-ai parity tests.
 */

export type OradsVascularity = "none" | "low" | "moderate" | "high";
export type OradsSeptations = "none" | "thin" | "thick";
export type OradsAscites = "absent" | "present";
export type OradsContour = "smooth" | "irregular";
export type OradsStructureKind = "solid" | "cystic" | "complex" | "multilocular";

export type OradsExtractedInput = {
  localization?: "ovarian" | "extraovarian";
  ovarySide?: "left" | "right" | "bilateral";
  menopause?: "pre" | "post";
  ageYears?: number;
  /** Largest dimension in mm (max of L/W/H). */
  diameterMm?: number;
  lengthMm?: number;
  widthMm?: number;
  heightMm?: number;
  solidComponent?: boolean;
  /** Solid component height when explicitly stated (mm). */
  solidComponentMm?: number;
  vascularity?: OradsVascularity;
  septations?: OradsSeptations;
  ascites?: OradsAscites;
  contour?: OradsContour;
  echogenicity?: "anechoic" | "hypo" | "hyper" | "heterogeneous";
  /** Cystic / solid / complex overall impression. */
  structure?: OradsStructureKind;
  /** Wizard lesion-class shortcut when inferable. */
  lesionClass?: "normal" | "physiological" | "simple" | "nonsimple" | "solid";
  locularity?: "unilocular" | "bilocular" | "multilocular";
  /** Multifollicular / no focal mass. */
  noFocalLesion?: boolean;
  sourceText?: string;
};

/** Cyrillic word suffix (JS \\w is ASCII-only). */
const CYR = "[а-яё]*";

function norm(text: string): string {
  return text.toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").trim();
}

function parseMmTriplet(t: string): number[] {
  const sizes: number[] = [];
  const triple =
    /(\d+(?:[.,]\d+)?)\s*[xх×]\s*(\d+(?:[.,]\d+)?)(?:\s*[xх×]\s*(\d+(?:[.,]\d+)?))?\s*мм/g;
  let m: RegExpExecArray | null;
  while ((m = triple.exec(t)) !== null) {
    sizes.push(
      ...[m[1], m[2], m[3]]
        .filter(Boolean)
        .map((v) => Number.parseFloat(v!.replace(",", "."))),
    );
  }
  for (const single of t.matchAll(/(\d+(?:[.,]\d+)?)\s*мм/g)) {
    sizes.push(Number.parseFloat(single[1]!.replace(",", ".")));
  }
  return sizes.filter((n) => Number.isFinite(n) && n > 0 && n <= 500);
}

function maxMm(sizes: number[]): number | undefined {
  if (!sizes.length) return undefined;
  return Math.max(...sizes);
}

export function parseOradsProtocolText(text: string): OradsExtractedInput {
  const raw = text.trim();
  const t = norm(raw);
  const out: OradsExtractedInput = { sourceText: raw };

  const sizes = parseMmTriplet(t);
  const max = maxMm(sizes);
  if (max !== undefined) {
    out.diameterMm = max;
    if (sizes.length >= 1) out.lengthMm = sizes[0];
    if (sizes.length >= 2) out.widthMm = sizes[1];
    if (sizes.length >= 3) out.heightMm = sizes[2];
  }

  const solidMm = t.match(/солидн(?:ый|ого)?\s+компонент\s+(\d+(?:[.,]\d+)?)\s*мм/);
  if (solidMm) {
    out.solidComponent = true;
    out.solidComponentMm = Number.parseFloat(solidMm[1]!.replace(",", "."));
  }

  if (new RegExp(`\\bлев(?:ом|ый|ого)?\\s+яичник|лев${CYR}\\s+яичник`).test(t))
    out.ovarySide = "left";
  if (
    new RegExp(
      `\\bправ(?:ом|ый|ого)?\\s+яичник|прав${CYR}\\s+яичник|в\\s+прав${CYR}\\s+яичник`,
    ).test(t)
  )
    out.ovarySide = "right";
  if (out.ovarySide === "left" && /\bправ/.test(t) && /\bлев/.test(t)) out.ovarySide = "bilateral";

  if (/\bпараовари|внеяичник|extraovarian/.test(t)) {
    out.localization = "extraovarian";
  } else if (/яичник/.test(t)) {
    out.localization = "ovarian";
  }

  if (/\bпостменопауз/.test(t)) out.menopause = "post";
  else if (/\bпременопауз/.test(t)) out.menopause = "pre";

  const ageM = t.match(/(?:возраст|лет)\s*[:—]?\s*(\d{2})/);
  if (ageM) out.ageYears = Number.parseInt(ageM[1]!, 10);

  if (/\bмультифолликуляр|без образован/.test(t)) {
    out.noFocalLesion = true;
    out.lesionClass = "normal";
  }

  if (/\bмультикистоз|множественн.*мелк.*образован/.test(t)) {
    out.locularity = "multilocular";
    out.lesionClass = "nonsimple";
  }

  if (/солидн(?:ый|ого|ое)\s+компонент|солидный\s+компонент/.test(t)) {
    out.solidComponent = true;
    const mm = t.match(/солидн(?:ый|ого|ое)\s+компонент\s+(\d+(?:[.,]\d+)?)\s*мм/);
    if (mm) out.solidComponentMm = Number.parseFloat(mm[1]!.replace(",", "."));
  }

  if (/солидн(?:ое|ый)\s+образован/.test(t) && !/кист/.test(t)) {
    out.structure = "solid";
    out.lesionClass = "solid";
    out.solidComponent = true;
  } else if (/солидн(?:ое|ый)(?:\s|,|$)/.test(t) && !/компонент/.test(t) && !/кист/.test(t)) {
    out.structure = "solid";
    out.lesionClass = "solid";
    out.solidComponent = true;
  }

  if (/без\s+солид/.test(t)) out.solidComponent = false;

  if (/кист(?:а|ы)(?:\s|,|$)/.test(t) && out.lesionClass !== "solid") {
    out.structure = "cystic";
    if (/сложн(?:ая|ой)\s+кист|(?:^|[,\s])с\s+перегород/.test(t)) {
      out.lesionClass = "nonsimple";
    } else if (!out.lesionClass) {
      out.lesionClass = "simple";
    }
  }

  if (/сложн(?:ая|ой)\s+кист/.test(t)) {
    out.structure = "complex";
    out.lesionClass = "nonsimple";
  }

  if (/анэхоген/.test(t)) out.echogenicity = "anechoic";
  else if (/неоднород/.test(t)) out.echogenicity = "heterogeneous";
  else if (/гипоэхоген/.test(t)) out.echogenicity = "hypo";

  if (new RegExp(`гладк${CYR}\\s+контур${CYR}|тонк${CYR}\\s+стенк${CYR}`).test(t)) {
    out.contour = "smooth";
  }
  if (new RegExp(`неровн${CYR}\\s+контур`).test(t)) out.contour = "irregular";

  if (/без\s+перегород/.test(t)) out.septations = "none";
  else if (
    new RegExp(
      `толст${CYR}\\s+перегород|утолщен${CYR}\\s+перегород|перегород${CYR}\\s+утолщен`,
    ).test(t)
  ) {
    out.septations = "thick";
    out.locularity = out.locularity ?? "multilocular";
    if (out.lesionClass !== "solid") out.lesionClass = "nonsimple";
  } else if (/перегород/.test(t)) {
    out.septations = "thin";
    out.locularity = out.locularity ?? "multilocular";
    if (out.lesionClass !== "solid") out.lesionClass = "nonsimple";
  }

  if (/унилокуляр/.test(t)) out.locularity = "unilocular";
  if (/мультилокуляр|мультикамерн|мультикистоз/.test(t)) out.locularity = "multilocular";

  if (new RegExp(`кровоток\\s+усилен|усилен${CYR}\\s+кровоток|выражен${CYR}\\s+кровоток`).test(t)) {
    out.vascularity = "high";
  } else if (
    /кровоток[^,.]*(?:определяется|в\s+перегородке)|(?:^|[,\s])с\s+кровоток|кровоток\s+есть|цдк[^,.]*определяется/.test(
      t,
    )
  ) {
    out.vascularity = "moderate";
  } else if (
    /кровоток[^,.]*(?:отриц|отсутств)|без\s+кровоток|цдк\s+отриц|не\s+определяется/.test(t)
  ) {
    out.vascularity = "none";
  }

  if (/асцит\s*\+|асцит\s+есть|асцит\s+присут/.test(t)) out.ascites = "present";
  else if (/асцита\s+нет|без\s+асцит/.test(t)) out.ascites = "absent";

  if (out.structure === "solid" || /солидн(?:ое|ый)\s+образован/.test(t)) {
    out.lesionClass = "solid";
  } else if (out.noFocalLesion) {
    out.lesionClass = "normal";
  } else if (!out.lesionClass && out.solidComponent && out.lesionClass !== "simple") {
    out.lesionClass = "nonsimple";
  } else if (!out.lesionClass && out.structure === "cystic") {
    out.lesionClass = "simple";
  }

  return out;
}
