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
  });
  expectEq("ORADS2", r2.category, 2);

  const r3 = calculateORADS({
    localization: "ovarian",
    menopause: "post",
    lesionKind: "nonphysiological",
    structure: "unilocular",
    unilocularSubtype: "simple_cyst",
    lengthMm: 70,
  });
  expectEq("ORADS3", r3.category, 3);

  const r4 = calculateORADS({
    localization: "ovarian",
    menopause: "post",
    lesionKind: "nonphysiological",
    structure: "multilocular",
    solidComponent: true,
    solidType: "irregular",
    bloodFlow: "moderate",
  });
  expectEq("ORADS4", r4.category, 4);

  const r5 = calculateORADS({
    localization: "ovarian",
    menopause: "post",
    lesionKind: "nonphysiological",
    structure: "solid",
    solidType: "irregular",
    bloodFlow: "marked",
  });
  expectEq("ORADS5", r5.category, 5);

  const r6 = calculateORADS({
    localization: "ovarian",
    menopause: "post",
    lesionKind: "nonphysiological",
    structure: "unilocular",
    unilocularSubtype: "simple_cyst",
    lengthMm: 55,
    ascites: true,
  });
  expectEq("OVERRIDE_ASCITES", r6.category, 4);

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
  expectEq("MULTILOCULAR_LARGE", r7a.category, 3);

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
  expectEq("INCOMPLETE_SEPTUM_RECLASS", r7b.category, 2);
  if (!r7b.structureReclassified) {
    throw new Error("INCOMPLETE_SEPTUM_RECLASS: expected structureReclassified");
  }
}

run();
