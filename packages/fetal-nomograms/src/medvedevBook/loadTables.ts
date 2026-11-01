import trimester1 from "../../data/medvedev-book/fetometry_trimester1.json";
import trimester23 from "../../data/medvedev-book/fetometry_trimester2_3.json";
import extended from "../../data/medvedev-book/fetometry_extended_biometry.json";
import heartChest from "../../data/medvedev-book/fetometry_heart_chest.json";
import dopplerPlacenta from "../../data/medvedev-book/fetometry_doppler_placenta.json";
import appendices from "../../data/medvedev-book/fetometry_appendices.json";

import {
  extractNumericBand,
  parseGaSlashParts,
  parseInclusiveRange,
} from "./parse";
import type {
  FetometryPopulation,
  FetometryRow,
  FetometrySection,
  FetometryTable,
  PercentileKind,
} from "./types";

type JsonRec = Record<string, unknown>;

function asRec(v: unknown): JsonRec {
  return v && typeof v === "object" ? (v as JsonRec) : {};
}

function unitFromOutput(output: unknown, fallback = "mm"): string {
  const o = asRec(output);
  if (typeof o.unit === "string") return o.unit;
  return fallback;
}

function titleFrom(meta: JsonRec, fallback: string): string {
  return typeof meta.title === "string" ? meta.title : fallback;
}

function pushTable(out: FetometryTable[], table: FetometryTable) {
  if (table.rows.length) out.push(table);
}

function flattenParamRows(
  data: unknown[],
  axisField: "ga" | "crl" | "crlRange" | "svd" | "gaRange" | "bpdRange",
  paramKeys: string[] | null,
  percentiles: number[] | undefined,
): { rowsByParam: Map<string, FetometryRow[]>; kind: PercentileKind } {
  const rowsByParam = new Map<string, FetometryRow[]>();
  let kind: PercentileKind = "p5_p95";

  for (const raw of data) {
    const row = asRec(raw);
    const base: Partial<FetometryRow> = {};

    if (axisField === "ga" && row.ga != null) {
      if (typeof row.ga === "string") {
        const parts = parseGaSlashParts(row.ga);
        if (parts) {
          base.gaWeeks = parts.weeks;
          base.gaDays = parts.days;
          base.label = row.ga;
        } else {
          const n = Number(row.ga);
          if (Number.isFinite(n)) {
            base.gaWeeks = n;
            base.label = String(row.ga);
          }
        }
      } else if (typeof row.ga === "number") {
        base.gaWeeks = row.ga;
        base.label = String(row.ga);
      }
    } else if (axisField === "crl" && typeof row.crl === "number") {
      base.crlMm = row.crl;
      base.label = String(row.crl);
    } else if (axisField === "crlRange" && typeof row.crlRange === "string") {
      const r = parseInclusiveRange(row.crlRange);
      if (r) {
        base.crlRange = r;
        base.label = row.crlRange;
      }
    } else if (axisField === "svd" && typeof row.svd === "number") {
      base.svdMm = row.svd;
      base.label = String(row.svd);
    } else if (axisField === "gaRange" && typeof row.gaRange === "string") {
      const r = parseInclusiveRange(row.gaRange);
      if (r) {
        base.gaRange = r;
        base.label = row.gaRange;
      }
    } else if (axisField === "bpdRange" && typeof row.bpdRange === "string") {
      const r = parseInclusiveRange(row.bpdRange);
      if (r) {
        base.bpdRange = r;
        base.label = row.bpdRange;
      }
    }

    const params = paramKeys?.length
      ? paramKeys
      : Object.keys(row).filter((k) => {
          if (["ga", "crl", "crlRange", "svd", "gaRange", "bpdRange"].includes(k)) return false;
          const v = row[k];
          return v != null && typeof v === "object";
        });

    if (!paramKeys && ("p5" in row || "p50" in row || "p95" in row || "p2_5" in row)) {
      const band = extractNumericBand(row, percentiles);
      if (band) {
        kind = band.kind;
        const list = rowsByParam.get("_") ?? [];
        list.push({ ...base, band: { pLow: band.pLow, p50: band.p50, pHigh: band.pHigh } } as FetometryRow);
        rowsByParam.set("_", list);
      }
      continue;
    }

    for (const pk of params.length ? params : ["_"]) {
      const src = pk === "_" ? row : asRec(row[pk]);
      const band = extractNumericBand(src, percentiles);
      if (!band) continue;
      kind = band.kind;
      const list = rowsByParam.get(pk) ?? [];
      list.push({
        ...base,
        band: {
          pLow: band.pLow,
          p50: band.p50,
          pHigh: band.pHigh,
          median: band.median,
          mom1_5: band.mom1_5,
        },
      } as FetometryRow);
      rowsByParam.set(pk, list);
    }
  }

  return { rowsByParam, kind };
}

const T1_PARAM_LABELS: Record<string, string> = {
  bpd: "БПР",
  hc: "ОГ",
  ac: "ОЖ",
  fl: "ДБК",
  nt: "ТВП",
  fourth_ventricle: "IV желудочек",
  nasal_bone: "Носовая кость",
  cp_of_ratio: "ДСС/ЛЗР",
  mesencephalon: "Мезэнцефалон",
  fhr: "ЧСС",
  dv_pi: "ПИ венозного протока",
  ut_pi: "ПИ маточных артерий",
  crl: "КТР",
  svd_dating: "СВД → срок",
};

function loadTrimester1(out: FetometryTable[]) {
  const tables = asRec(trimester1.tables);

  // 1.1 SVD → GA strings
  {
    const meta = asRec(tables.svd_gestational_age);
    const data = (meta.data as unknown[]) ?? [];
    const rows: FetometryRow[] = [];
    for (const raw of data) {
      const row = asRec(raw);
      if (typeof row.svd !== "number") continue;
      rows.push({
        svdMm: row.svd,
        label: String(row.svd),
        band: {
          gaP5: typeof row.p5 === "string" ? row.p5 : undefined,
          gaP50: typeof row.p50 === "string" ? row.p50 : undefined,
          gaP95: typeof row.p95 === "string" ? row.p95 : undefined,
        },
      });
    }
    pushTable(out, {
      id: "t1.svd_dating",
      bookTableId: "svd_gestational_age",
      titleRu: T1_PARAM_LABELS.svd_dating,
      unit: "нед+дни",
      axis: "svd",
      percentileKind: "ga_strings",
      section: "t1",
      rows,
    });
  }

  // 1.2 CRL by GA
  {
    const meta = asRec(tables.crl_by_ga);
    const { rowsByParam, kind } = flattenParamRows((meta.data as unknown[]) ?? [], "ga", null, [5, 50, 95]);
    pushTable(out, {
      id: "t1.crl",
      bookTableId: "crl_by_ga",
      titleRu: T1_PARAM_LABELS.crl,
      unit: unitFromOutput(meta.output, "mm"),
      axis: "ga_string",
      percentileKind: kind,
      section: "t1",
      rows: rowsByParam.get("_") ?? [],
    });
  }

  // 1.3 fetometry 11-14
  {
    const meta = asRec(tables.fetometry_11_14w);
    const { rowsByParam } = flattenParamRows((meta.data as unknown[]) ?? [], "ga", ["bpd", "hc", "ac", "fl"], [5, 50, 95]);
    for (const [pk, rows] of rowsByParam) {
      pushTable(out, {
        id: `t1.${pk}`,
        bookTableId: "fetometry_11_14w",
        titleRu: T1_PARAM_LABELS[pk] ?? pk.toUpperCase(),
        unit: "mm",
        axis: "ga_weeks",
        percentileKind: "p5_p95",
        section: "t1",
        rows,
      });
    }
  }

  const crlRangeMaps: Array<[string, string, string]> = [
    ["nt_by_crl", "t1.nt", T1_PARAM_LABELS.nt],
    ["fourth_ventricle_by_crl", "t1.fourth_ventricle", T1_PARAM_LABELS.fourth_ventricle],
    ["nasal_bone_by_crl", "t1.nasal_bone", T1_PARAM_LABELS.nasal_bone],
  ];
  for (const [bookId, id, title] of crlRangeMaps) {
    const meta = asRec(tables[bookId]);
    const { rowsByParam, kind } = flattenParamRows((meta.data as unknown[]) ?? [], "crlRange", null, [5, 50, 95]);
    pushTable(out, {
      id,
      bookTableId: bookId,
      titleRu: title,
      unit: unitFromOutput(meta.output, "mm"),
      axis: "crl_range",
      percentileKind: kind,
      section: "t1",
      rows: rowsByParam.get("_") ?? [],
    });
  }

  const crlExactMaps: Array<[string, string, string, string]> = [
    ["cp_of_ratio_by_crl", "t1.cp_of_ratio", T1_PARAM_LABELS.cp_of_ratio, "ratio"],
    ["mesencephalon_by_crl", "t1.mesencephalon", T1_PARAM_LABELS.mesencephalon, "mm"],
  ];
  for (const [bookId, id, title, unit] of crlExactMaps) {
    const meta = asRec(tables[bookId]);
    const { rowsByParam, kind } = flattenParamRows((meta.data as unknown[]) ?? [], "crl", null, [5, 50, 95]);
    pushTable(out, {
      id,
      bookTableId: bookId,
      titleRu: title,
      unit: unitFromOutput(meta.output, unit),
      axis: "crl_exact",
      percentileKind: kind,
      section: "t1",
      rows: rowsByParam.get("_") ?? [],
    });
  }

  const gaWeekMaps: Array<[string, string, string, string]> = [
    ["fetal_heart_rate", "t1.fhr", T1_PARAM_LABELS.fhr, "уд/мин"],
    ["ductus_venosus_pi", "t1.dv_pi", T1_PARAM_LABELS.dv_pi, "index"],
    ["uterine_artery_pi", "t1.ut_pi", T1_PARAM_LABELS.ut_pi, "index"],
  ];
  for (const [bookId, id, title, unit] of gaWeekMaps) {
    const meta = asRec(tables[bookId]);
    const { rowsByParam, kind } = flattenParamRows((meta.data as unknown[]) ?? [], "ga", null, [5, 50, 95]);
    pushTable(out, {
      id,
      bookTableId: bookId,
      titleRu: title,
      unit: unitFromOutput(meta.output, unit),
      axis: "ga_weeks",
      percentileKind: kind,
      section: "t1",
      rows: rowsByParam.get("_") ?? [],
    });
  }
}

function loadListStyleTables(
  out: FetometryTable[],
  file: { tables: unknown },
  section: FetometrySection,
  idPrefix: string,
  labelMap: Record<string, string>,
) {
  const list = Array.isArray(file.tables) ? file.tables : [];
  for (const rawTable of list) {
    const meta = asRec(rawTable);
    const bookId = String(meta.id ?? "");
    const percentiles = Array.isArray(meta.percentiles) ? (meta.percentiles as number[]) : [5, 50, 95];
    const data = asRec(meta.data);
    const weekKeys = Object.keys(data);
    if (!weekKeys.length) continue;

    // Detect param keys from first week
    const sample = asRec(data[weekKeys[0]]);
    const nestedParams = Object.keys(sample).filter((k) => {
      const v = sample[k];
      return v && typeof v === "object";
    });
    const isFlat =
      nestedParams.length === 0 &&
      ("p5" in sample || "p50" in sample || "p2_5" in sample || "median" in sample);

    const paramKeys = isFlat ? ["_"] : nestedParams.length ? nestedParams : ["_"];

    for (const pk of paramKeys) {
      const rows: FetometryRow[] = [];
      let kind: PercentileKind = "p5_p95";
      for (const wk of weekKeys) {
        const cell = isFlat ? asRec(data[wk]) : asRec(asRec(data[wk])[pk]);
        const band = extractNumericBand(cell, percentiles);
        if (!band) continue;
        kind = band.kind;
        const range = parseInclusiveRange(wk);
        const n = Number(wk);
        const row: FetometryRow = {
          label: wk,
          band: {
            pLow: band.pLow,
            p50: band.p50,
            pHigh: band.pHigh,
            median: band.median,
            mom1_5: band.mom1_5,
          },
        };
        if (range) row.gaRange = range;
        else if (Number.isFinite(n)) row.gaWeeks = n;
        rows.push(row);
      }

      const title =
        pk === "_"
          ? titleFrom(meta, bookId)
          : labelMap[pk] ?? `${titleFrom(meta, bookId)} · ${pk}`;

      pushTable(out, {
        id: `${idPrefix}.${bookId}.${pk === "_" ? "value" : pk}`,
        bookTableId: bookId,
        titleRu: title,
        unit: inferUnit(pk, meta),
        axis: rows.some((r) => r.gaRange) ? "ga_range" : "ga_weeks",
        percentileKind: kind,
        section,
        rows,
      });
    }
  }
}

function inferUnit(paramKey: string, meta: JsonRec): string {
  if (paramKey.includes("cm_s") || paramKey.endsWith("_cm_s")) return "см/с";
  if (paramKey.includes("_ml") || paramKey.endsWith("_ml")) return "мл";
  if (paramKey.includes("_cm") || paramKey.includes("perimeter_cm")) return "см";
  if (paramKey.includes("_pi") || paramKey.includes("ratio") || paramKey === "cardiothoracic_ratio") return "index";
  if (paramKey.includes("mm2")) return "мм²";
  if (paramKey.includes("angle")) return "°";
  const out = asRec(meta.output);
  if (typeof out.unit === "string") return out.unit;
  return "mm";
}

function loadObjectGaTables(
  out: FetometryTable[],
  file: { tables: unknown },
  section: FetometrySection,
  idPrefix: string,
  labels: Record<string, { id: string; title: string; unit?: string; params?: string[] }>,
) {
  const tables = asRec(file.tables);
  for (const [bookKey, spec] of Object.entries(labels)) {
    const meta = asRec(tables[bookKey]);
    if (!meta || !Object.keys(meta).length) continue;

    // CSP special dual
    if (bookKey === "csp_width") {
      const byGA = asRec(meta.byGA);
      const byBPD = asRec(meta.byBPD);
      const gaFlat = flattenParamRows((byGA.data as unknown[]) ?? [], "ga", null, [5, 50, 95]);
      pushTable(out, {
        id: "t2.csp_by_ga",
        bookTableId: "csp_width",
        titleRu: "ШЗП (по сроку)",
        unit: "mm",
        axis: "ga_weeks",
        percentileKind: gaFlat.kind,
        section,
        rows: gaFlat.rowsByParam.get("_") ?? [],
      });
      const bpdFlat = flattenParamRows((byBPD.data as unknown[]) ?? [], "bpdRange", null, [5, 50, 95]);
      pushTable(out, {
        id: "t2.csp_by_bpd",
        bookTableId: "csp_width",
        titleRu: "ШЗП (по БПР)",
        unit: "mm",
        axis: "bpd_range",
        percentileKind: bpdFlat.kind,
        section,
        rows: bpdFlat.rowsByParam.get("_") ?? [],
      });
      continue;
    }

    const data = (meta.data as unknown[]) ?? [];
    const axisField =
      data[0] && typeof asRec(data[0]).gaRange === "string"
        ? "gaRange"
        : ("ga" as const);

    const { rowsByParam, kind } = flattenParamRows(
      data,
      axisField,
      spec.params ?? null,
      [5, 50, 95],
    );

    if (spec.params?.length) {
      for (const pk of spec.params) {
        pushTable(out, {
          id: `${idPrefix}.${pk}`,
          bookTableId: bookKey,
          titleRu: spec.params.length > 1 ? paramTitle(pk) : spec.title,
          unit: spec.unit ?? unitFromOutput(meta.output, "mm"),
          axis: axisField === "gaRange" ? "ga_range" : "ga_weeks",
          percentileKind: kind,
          section,
          rows: rowsByParam.get(pk) ?? [],
        });
      }
    } else {
      pushTable(out, {
        id: spec.id,
        bookTableId: bookKey,
        titleRu: spec.title,
        unit: spec.unit ?? unitFromOutput(meta.output, "mm"),
        axis: axisField === "gaRange" ? "ga_range" : typeof asRec(data[0]).ga === "string" ? "ga_string" : "ga_weeks",
        percentileKind: kind,
        section,
        rows: rowsByParam.get("_") ?? [],
      });
    }
  }
}

function paramTitle(pk: string): string {
  const map: Record<string, string> = {
    fl: "ДБК",
    hl: "ДПК",
    kkrchm: "ККРЧМ",
    pzrchm: "ПЗРЧМ",
    eor: "ЭОР",
    ior: "ИОР",
    dg: "ДГ",
    chiasm: "Хиазма",
    nerve: "Зрительный нерв",
    tract: "Зрительный тракт",
  };
  return map[pk] ?? pk;
}

const POPULATION_BY_APPENDIX: Record<string, FetometryPopulation> = {
  appendix_1: "moscow",
  appendix_2: "kazakhstan",
  appendix_3: "belarus",
  appendix_4: "uzbekistan",
};

const APPENDIX_PARAM_LABELS: Record<string, string> = {
  bpd_mm: "БПР",
  ofd_mm: "ЛЗР",
  hc_mm: "ОГ",
  ac_mm: "ОЖ",
  fl_mm: "ДБК",
  hl_mm: "ДПК",
  abd_mean_diameter_mm: "СДЖ",
};

function loadAppendices(out: FetometryTable[]) {
  const list = Array.isArray(appendices.tables) ? appendices.tables : [];
  for (const raw of list) {
    const meta = asRec(raw);
    const bookId = String(meta.id ?? "");
    const population = POPULATION_BY_APPENDIX[bookId];
    if (!population) continue;
    const data = asRec(meta.data);
    const weekKeys = Object.keys(data);
    const sample = asRec(data[weekKeys[0]]);
    const params = Object.keys(sample).filter((k) => typeof sample[k] === "object");
    for (const pk of params) {
      const rows: FetometryRow[] = [];
      for (const wk of weekKeys) {
        const n = Number(wk);
        const cell = asRec(asRec(data[wk])[pk]);
        const band = extractNumericBand(cell, [5, 50, 95]);
        if (!band || !Number.isFinite(n)) continue;
        rows.push({
          gaWeeks: n,
          label: wk,
          band: { pLow: band.pLow, p50: band.p50, pHigh: band.pHigh },
        });
      }
      pushTable(out, {
        id: `appendix.${population}.${pk}`,
        bookTableId: bookId,
        titleRu: APPENDIX_PARAM_LABELS[pk] ?? pk,
        unit: "mm",
        axis: "ga_weeks",
        percentileKind: "p5_p95",
        section: "appendix",
        population,
        rows,
      });
    }
  }
}

let cached: FetometryTable[] | null = null;

export function listMedvedevBookTables(): FetometryTable[] {
  if (cached) return cached;
  const out: FetometryTable[] = [];
  loadTrimester1(out);
  loadObjectGaTables(out, trimester23, "t2_base", "t2", {
    bpd_16_40w: { id: "t2.bpd", title: "БПР" },
    ofd_16_40w: { id: "t2.ofd", title: "ЛЗР" },
    hc_16_40w: { id: "t2.hc", title: "ОГ" },
    csp_width: { id: "t2.csp", title: "ШЗП" },
    lateral_ventricle_width: { id: "t2.lv", title: "ШБЖ" },
    sylvian_fissure_depth: { id: "t2.sylvian", title: "ГСБ" },
    cerebellum_transverse_diameter: { id: "t2.cerebellum", title: "ПДМ" },
    posterior_fossa_size: { id: "t2.pf", title: "ЗЧЯ" },
    nasal_bone_length_2nd_trimester: { id: "t2.nb", title: "ДНК" },
    prenasal_thickness: { id: "t2.prenasal", title: "ТПТ" },
    ac_16_40w: { id: "t2.ac", title: "ОЖ" },
    fl_hl_16_40w: { id: "t2.fl_hl", title: "ДБК/ДПК", params: ["fl", "hl"] },
  });
  loadObjectGaTables(out, extended, "extended", "ext", {
    parietooccipital_fissure_depth: { id: "ext.pof", title: "ГПОБ" },
    corpus_callosum_length: { id: "ext.cc", title: "ДМТ" },
    cerebellar_hemisphere_perimeter: { id: "ext.chp", title: "ППМ", unit: "cm" },
    cerebellar_vermis_sizes: { id: "ext.vermis", title: "Червь", params: ["kkrchm", "pzrchm"] },
    brainstem_vermis_angle: { id: "ext.bva", title: "Угол ствол–червь", unit: "°" },
    optic_chiasm_width_coronal: { id: "ext.ocw", title: "Ширина хиазмы" },
    optic_tract_axial: { id: "ext.ota", title: "Зрительные пути", params: ["chiasm", "nerve", "tract"] },
    orbital_measurements: { id: "ext.orb", title: "Орбиты", params: ["eor", "ior", "dg"] },
    ear_length: { id: "ext.ear", title: "Длина уха" },
    tongue_perimeter: { id: "ext.tongue", title: "Периметр языка" },
    trachea_diameter: { id: "ext.trachea", title: "Диаметр трахеи" },
    thyroid_perimeter: { id: "ext.thyroid", title: "Периметр щитовидки" },
    clavicle_length: { id: "ext.clavicle", title: "Длина ключицы" },
    scapula_width: { id: "ext.scapula", title: "Ширина лопатки" },
  });

  const heartLabels: Record<string, string> = {
    ap_mm: "Тимус ПЗР",
    diameter_mm: "Тимус диаметр",
    perimeter_mm: "Тимус периметр",
    left_ml: "Лёгкое левое",
    right_ml: "Лёгкое правое",
    total_ml: "Лёгкие суммарно",
    heart_cross_section_area_mm2: "ППСС",
    cardiothoracic_ratio: "КТО",
    left_atrium_mm: "Левое предсердие",
    right_atrium_mm: "Правое предсердие",
    left_ventricle_mm: "Левый желудочек",
    right_ventricle_mm: "Правый желудочек",
    av_septum_length_mm: "АВ-перегородка",
    aorta_diameter_mm: "Аорта",
    pulmonary_trunk_diameter_mm: "Лёгочный ствол",
  };
  loadListStyleTables(out, heartChest, "heart", "heart", heartLabels);

  const dopplerLabels: Record<string, string> = {
    aortic_isthmus_mm: "Перешеек аорты",
    ductus_arteriosus_mm: "Артериальный проток",
    ap_mm: "Печень ПЗР",
    vertical_mm: "Печень вертикаль",
    transverse_mm: "Печень поперечник",
    spleen_perimeter_cm: "Периметр селезёнки",
    colon_diameter_mm: "Толстый кишечник",
    length_mm: "Почка длина",
    thickness_mm: "Почка толщина",
    width_mm: "Почка ширина",
    adrenal_length_mm: "Надпочечник",
    forearm_bones_mm: "Кости предплечья",
    shin_bones_mm: "Кости голени",
    foot_length_mm: "Стопа",
    placenta_thickness_mm: "Толщина плаценты",
    afi_mm: "ИАЖ",
    uterine_arteries_pi: "ПИ маточных артерий",
    umbilical_artery_pi: "ПИ артерии пуповины",
    mca_pi: "ПИ СМА",
    mca_psv_cm_s: "ПССК СМА",
    ductus_venosus_pi: "ПИ венозного протока",
    aorta_psv_cm_s: "ПССК аорты",
    pulmonary_trunk_psv_cm_s: "ПССК лёгочного ствола",
  };
  loadListStyleTables(out, dopplerPlacenta, "doppler", "dop", dopplerLabels);
  loadAppendices(out);

  cached = out;
  return out;
}

export function getMedvedevBookTable(id: string): FetometryTable | undefined {
  return listMedvedevBookTables().find((t) => t.id === id);
}

export function listTablesBySection(section: FetometrySection): FetometryTable[] {
  return listMedvedevBookTables().filter((t) => t.section === section);
}
