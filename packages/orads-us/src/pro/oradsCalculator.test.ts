import { calculateORADS } from "./oradsCalculator";

function expectEq(name: string, actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(`${name}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function run() {
  const r1 = calculateORADS({
    localization: "ovarian",
    menopause: "pre",
    lesionKind: "physiological",
    physiologicalType: "follicle",
    lengthMm: 25,
    widthMm: 20,
    heightMm: 18,
  });
  expectEq("ORADS1", r1.category, 1);

  const r2 = calculateORADS({
    localization: "ovarian",
    menopause: "pre",
    lesionKind: "nonphysiological",
    structure: "unilocular",
    unilocularSubtype: "simple_cyst",
    lengthMm: 40, widthMm: 32, heightMm: 28,
  });
  expectEq("ORADS2", r2.category, 2);

  const r3 = calculateORADS({
    localization: "ovarian",
    menopause: "post",
    lesionKind: "nonphysiological",
    structure: "unilocular",
    unilocularSubtype: "simple_cyst",
    lengthMm: 70, widthMm: 56, heightMm: 49,
  });
  expectEq("ORADS3", r3.category, 2);

  const r4 = calculateORADS({
    localization: "ovarian",
    menopause: "post",
    lesionKind: "nonphysiological",
    structure: "multilocular",
    solidComponent: true,
    solidType: "irregular",
    bloodFlow: "moderate",
    iotaColorScore: "2",
    lengthMm: 50, widthMm: 40, heightMm: 35,
  });
  expectEq("ORADS4", r4.category, 4);

  const r5 = calculateORADS({
    localization: "ovarian",
    menopause: "post",
    lesionKind: "nonphysiological",
    structure: "solid",
    solidType: "irregular",
    bloodFlow: "marked",
    lengthMm: 50, widthMm: 40, heightMm: 35,
  });
  expectEq("ORADS5", r5.category, 5);

  const r6 = calculateORADS({
    localization: "ovarian",
    menopause: "post",
    lesionKind: "nonphysiological",
    structure: "unilocular",
    unilocularSubtype: "simple_cyst",
    lengthMm: 55, widthMm: 44, heightMm: 38.5,
    ascites: true,
  });
  expectEq("ASCITES_DOES_NOT_UPGRADE_ORADS_2", r6.category, 2);

  const r7a = calculateORADS({
    localization: "ovarian",
    menopause: "pre",
    lesionKind: "nonphysiological",
    structure: "multilocular",
    septaThickness: "thin",
    solidComponent: false,
    lengthMm: 110,
    widthMm: 100,
    heightMm: 90,
  });
  expectEq("MULTILOCULAR_LARGE_NO_CS_STATUS", r7a.status, "needs_data");
  expectEq("MULTILOCULAR_LARGE_NO_CS_CATEGORY", r7a.category, null);
  if (!r7a.missing.some((m) => /цветов/i.test(m))) {
    throw new Error("MULTILOCULAR_LARGE_NO_CS: expected colour score in missing");
  }

  const r7b = calculateORADS({
    localization: "ovarian",
    menopause: "pre",
    lesionKind: "nonphysiological",
    structure: "multilocular",
    septaThickness: "thin",
    solidComponent: false,
    incompleteSeptum: true,
    lengthMm: 110,
    widthMm: 100,
    heightMm: 90,
  });
  expectEq("INCOMPLETE_SEPTUM_RECLASS", r7b.category, 3);
  if (!r7b.structureReclassified) {
    throw new Error("INCOMPLETE_SEPTUM_RECLASS: expected structureReclassified");
  }

  const r8 = calculateORADS({
    localization: "ovarian",
    ageYears: 34,
    cycleDay: 12,
    menopause: "pre",
    lesionKind: "nonphysiological",
    structure: "unilocular",
    unilocularSubtype: "simple_cyst",
    lengthMm: 45, widthMm: 36, heightMm: 31.5,
  });
  expectEq("FUNCTIONAL_CYST_PATTERN", r8.category, 2);
  if (r8.patternLabel !== "Вероятна функциональная киста") {
    throw new Error(`FUNCTIONAL_CYST_PATTERN: expected pattern label, got ${String(r8.patternLabel)}`);
  }

  const rPp4 = calculateORADS({
    localization: "ovarian",
    menopause: "pre",
    lesionKind: "nonphysiological",
    structure: "unilocular",
    unilocularSubtype: "simple_cyst",
    solidComponent: true,
    solidType: "papillary",
    papillaryProjectionCount: "2",
    lengthMm: 45, widthMm: 36, heightMm: 31.5,
  });
  expectEq("PAPILLARY_1_3", rPp4.category, 4);

  const rPp5 = calculateORADS({
    localization: "ovarian",
    menopause: "pre",
    lesionKind: "nonphysiological",
    structure: "unilocular",
    unilocularSubtype: "simple_cyst",
    solidComponent: true,
    solidType: "papillary",
    papillaryProjectionCount: "4plus",
    lengthMm: 45, widthMm: 36, heightMm: 31.5,
  });
  expectEq("PAPILLARY_GE4", rPp5.category, 5);

  const r9 = calculateORADS({
    localization: "ovarian",
    menopause: "pre",
    lesionKind: "normal_ovary",
    normalOvaryPattern: "multifollicular",
    lengthMm: 40,
    widthMm: 20,
    heightMm: 40,
  });
  expectEq("MULTIFOLLICULAR_ORADS", r9.category, 1);
  expectEq("MULTIFOLLICULAR_VOLUME", r9.volumeMl, 16.74);
  if (r9.patternLabel !== "Мультифолликулярный рисунок") {
    throw new Error(`MULTIFOLLICULAR_PATTERN: got ${String(r9.patternLabel)}`);
  }
}

run();
