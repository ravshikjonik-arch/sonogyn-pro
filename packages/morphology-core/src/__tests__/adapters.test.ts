import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateBirads, type BiradsInput } from "@repo/birads-us";
import { calculateAdenomyosisScore, type MusaAdenomyosisAssessmentInput } from "@repo/musa-framework";
import { calculateORADS, mapProInputToUs2022, type OradsInput } from "@repo/orads-us/pro";
import { evaluateAcrTirads, type TiradsAcrInput } from "@repo/tirads-acr";

import { fromBiradsUsInput, toBiradsUsInput } from "../adapters/birads-us";
import { fromMusaAdenomyosisInput, toMusaAdenomyosisInput } from "../adapters/musa-adenomyosis";
import { fromOradsProInput, toOradsProInput } from "../adapters/orads-us";
import { fromTiradsAcrInput, toTiradsAcrInput } from "../adapters/tirads-acr";
import { b, e, mm, obs, set, T } from "./fixtures";

const FROM = { source: "structured_protocol" as const, timestamp: T, subjectId: "lesion-1" };

describe("O-RADS US Pro adapter", () => {
  /** Minimal valid core: hard requirements satisfied (kind, structure, size). */
  const core = (side: "left" | "right" | null = null) => {
    const lat = side ? { laterality: side } : {};
    return [
      obs("adnexa.lesion_kind", "adnexa", e("nonphysiological"), lat),
      obs("adnexa.structure", "adnexa", e("unilocular"), lat),
      mm("adnexa.lesion_length", "adnexa", 45, lat),
    ];
  };
  /** Every feature mapProInputToUs2022 would otherwise default — explicitly stated. */
  const fullyStated = () => [
    obs("adnexa.localization", "adnexa", e("ovarian"), { laterality: "left" }),
    ...core("left"),
    mm("adnexa.lesion_width", "adnexa", 36, { laterality: "left" }),
    mm("adnexa.lesion_height", "adnexa", 31.5, { laterality: "left" }),
    obs("adnexa.cyst_content_echogenicity", "adnexa", e("anechoic"), { laterality: "left" }),
    obs("adnexa.solid_component", "adnexa", b(true), { laterality: "left" }),
    obs("adnexa.solid_component_contour", "adnexa", e("papillary"), { laterality: "left" }),
    obs("adnexa.papillary_projection_count", "adnexa", e("1"), { laterality: "left" }),
    mm("adnexa.largest_solid_component_diameter", "adnexa", 6, { laterality: "left" }),
    obs("adnexa.acoustic_shadows", "adnexa", b(false), { laterality: "left" }),
    obs("adnexa.iota_color_score", "adnexa", e("2"), { laterality: "left" }),
    obs("pelvis.ascites", "pelvis", b(false)),
    obs("pelvis.peritoneal_nodules", "pelvis", b(false)),
  ];
  const PARTIAL = { allowPartial: true } as const;

  it("maps a fully stated lesion → complete OradsInput accepted by the existing engine", () => {
    const r = toOradsProInput(fullyStated(), { menopause: "pre" });
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.completeness, "complete");
    assert.deepEqual(r.incompleteFeatures, []);
    assert.equal(r.input.echogenicity, "anechoic");
    assert.equal(r.input.ovarySide, "left");
    assert.equal(r.input.lengthMm, 45);
    assert.equal(r.input.papillaryProjectionCount, "1");
    const result = calculateORADS(r.input);
    assert.ok([1, 2, 3, 4, 5].includes(result.category));
  });

  it("SAFETY: blocks when mapProInputToUs2022 would silently default unstated features", () => {
    const r = toOradsProInput(core(), { menopause: "pre" });
    assert.equal(r.ok, false);
    if (r.ok) return;
    assert.ok(r.errors.some((x) => x.code === "incomplete_for_engine"));
    for (const f of ["adnexa.solid_component", "adnexa.acoustic_shadows", "pelvis.ascites", "adnexa.papillary_projection_count"]) {
      assert.ok(r.missing.includes(f), `expected ${f} in missing`);
    }
  });

  it("SAFETY: allowPartial returns an explicitly partial result, never silently complete", () => {
    const r = toOradsProInput(core(), { menopause: "pre" }, PARTIAL);
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.completeness, "partial");
    assert.ok(r.incompleteFeatures.includes("adnexa.solid_component"));
    assert.ok(r.warnings.some((w) => w.code === "engine_default_risk"));
  });

  it("SAFETY: hard-missing inputs that yield a placeholder category 3 block even with allowPartial", () => {
    const noKind = toOradsProInput([obs("adnexa.structure", "adnexa", e("unilocular")), mm("adnexa.lesion_length", "adnexa", 30)], { menopause: "pre" }, PARTIAL);
    assert.ok(!noKind.ok && noKind.missing.includes("adnexa.lesion_kind"));

    const noSize = toOradsProInput(core().filter((o) => o.feature !== "adnexa.lesion_length"), { menopause: "pre" }, PARTIAL);
    assert.ok(!noSize.ok && noSize.missing.includes("adnexa.lesion_length|width|height"));

    const noStructure = toOradsProInput(core().filter((o) => o.feature !== "adnexa.structure"), { menopause: "pre" }, PARTIAL);
    assert.ok(!noStructure.ok && noStructure.missing.includes("adnexa.structure"));
  });

  it("SAFETY: explicit not_applicable counts as stated; not_assessed does not", () => {
    const stated = fullyStated().map((o) =>
      o.feature === "adnexa.iota_color_score" ? obs(o.feature, "adnexa", null, { status: "not_applicable" }) : o,
    );
    const r1 = toOradsProInput(stated, { menopause: "pre" });
    assert.ok(r1.ok && r1.completeness === "complete");

    const unassessed = fullyStated().map((o) =>
      o.feature === "adnexa.iota_color_score" ? obs(o.feature, "adnexa", null, { status: "not_assessed" }) : o,
    );
    const r2 = toOradsProInput(unassessed, { menopause: "pre" });
    assert.ok(!r2.ok && r2.missing.includes("adnexa.iota_color_score"));
  });

  it("normalizes canonical echogenicity codes to engine codes", () => {
    const r = toOradsProInput(
      [...core(), obs("adnexa.cyst_content_echogenicity", "adnexa", e("hypoechoic"))],
      { menopause: "post" },
      PARTIAL,
    );
    assert.equal(r.ok && r.input.echogenicity, "hypo");
  });

  it("never fills absent features: not_assessed stays undefined, not false/0", () => {
    const r = toOradsProInput(
      [
        ...core(),
        obs("adnexa.solid_component", "adnexa", null, { status: "not_assessed" }),
        obs("adnexa.papillary_projection_count", "adnexa", null, { status: "not_assessed" }),
      ],
      { menopause: "pre" },
      PARTIAL,
    );
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal("solidComponent" in r.input, false);
    assert.equal("papillaryProjectionCount" in r.input, false);
    assert.deepEqual(r.notAssessed.sort(), ["adnexa.papillary_projection_count", "adnexa.solid_component"]);
  });

  it("confirmed negative is passed as an explicit negative", () => {
    const r = toOradsProInput([...core(), obs("adnexa.solid_component", "adnexa", b(false))], { menopause: "pre" }, PARTIAL);
    assert.equal(r.ok && r.input.solidComponent, false);
  });

  it("excludes AI-suggested features unless explicitly accepted (and then warns)", () => {
    const ai = obs("adnexa.solid_component", "adnexa", b(true), {
      status: "suggested",
      source: "ai_text_extraction",
      confidence: { score: 0.95, method: "model_self_report" },
    });
    const base = [...core(), ai];
    const strict = toOradsProInput(base, { menopause: "pre" }, PARTIAL);
    assert.equal(strict.ok && "solidComponent" in strict.input, false);
    assert.ok(strict.warnings.some((w) => w.code === "not_confirmed_excluded"));

    const draft = toOradsProInput(base, { menopause: "pre" }, { ...PARTIAL, acceptStatuses: ["confirmed", "suggested"] });
    assert.equal(draft.ok && draft.input.solidComponent, true);
    assert.ok(draft.warnings.some((w) => w.code === "non_confirmed_used"));
  });

  it("fails explicitly on missing preconditions, conflicts and contradictions", () => {
    const noMenopause = toOradsProInput(core(), {}, PARTIAL);
    assert.ok(!noMenopause.ok && noMenopause.missing.includes("context.menopause"));

    const conflict = toOradsProInput([...core(), obs("adnexa.structure", "adnexa", e("solid"))], { menopause: "pre" }, PARTIAL);
    assert.ok(!conflict.ok && conflict.errors.some((x) => x.code === "conflicting_values"));

    const contradicted = toOradsProInput(
      [...core(), obs("adnexa.solid_component", "adnexa", null, { status: "contradicted", alternatives: [b(true), b(false)] })],
      { menopause: "pre" },
      PARTIAL,
    );
    // TASK 04.1: a contradiction blocks the whole conversion (excluding it would let the engine default it).
    assert.ok(!contradicted.ok && contradicted.errors.some((x) => x.code === "contradicted"));
  });

  it("warns on features from another modality and on midline laterality", () => {
    const r = toOradsProInput(
      [
        obs("adnexa.lesion_kind", "adnexa", e("nonphysiological")),
        obs("adnexa.structure", "adnexa", e("unilocular"), { laterality: "midline" }),
        mm("adnexa.lesion_length", "adnexa", 30),
        obs("breast_us.mass_shape", "breast", e("oval")),
      ],
      { menopause: "pre" },
      PARTIAL,
    );
    assert.ok(r.ok && r.warnings.some((w) => w.code === "unsupported_feature"));
    assert.ok(r.ok && r.warnings.some((w) => w.code === "unsupported_transformation"));
  });

  it("round-trips supported OradsInput fields without loss; reports lossy ones", () => {
    const input: OradsInput = {
      localization: "ovarian",
      ovarySide: "right",
      menopause: "post",
      ageYears: 58,
      lesionKind: "nonphysiological",
      structure: "multilocular",
      septaCount: "1-3",
      septaThickness: "thin",
      solidComponent: false,
      echogenicity: "hyper",
      lengthMm: 52,
      widthMm: 40,
      heightMm: 33,
      bloodFlow: "minimal",
      ascites: false,
      peritonealNodules: false,
      iotaColorScore: "2",
      acousticShadows: false,
      papillaryProjectionCount: "0",
      solidType: "smooth",
      customDescription: "свободный текст",
    };
    const back = fromOradsProInput(input, FROM);
    assert.ok(back.lossy.some((l) => l.engineKey === "customDescription"));
    const again = toOradsProInput(back.observations, back.context);
    assert.equal(again.ok, true);
    if (!again.ok) return;
    assert.equal(again.completeness, "complete");
    const { customDescription: _drop, ...expected } = input;
    assert.deepEqual(again.input, expected);
  });

  it("output can be chained into the existing v2022 mapper unchanged", () => {
    const r = toOradsProInput(fullyStated(), { menopause: "pre" });
    assert.ok(r.ok);
    if (r.ok) assert.ok(mapProInputToUs2022(r.input));
  });
});

describe("BI-RADS US adapter", () => {
  const mass = () => [
    obs("breast_us.finding_type", "breast", e("mass"), { laterality: "right" }),
    obs("breast_us.mass_shape", "breast", e("oval")),
    obs("breast_us.mass_orientation", "breast", e("parallel")),
    obs("breast_us.mass_margin", "breast", e("circumscribed")),
    obs("breast_us.echo_pattern", "breast", e("anechoic")),
    obs("breast_us.posterior_features", "breast", e("enhancement")),
    obs("breast_us.vascularity", "breast", e("none")),
  ];

  it("maps canonical → BiradsInput and the existing engine accepts it", () => {
    const r = toBiradsUsInput(mass());
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.input.margin, "circumscribed");
    assert.ok(evaluateBirads(r.input).category.length > 0);
  });

  it("does not default missing required descriptors", () => {
    const r = toBiradsUsInput(mass().filter((o) => o.feature !== "breast_us.vascularity"));
    assert.ok(!r.ok && r.missing.includes("breast_us.vascularity"));
  });

  it("refuses non-mass with not_applicable mass descriptors (engine cannot represent it)", () => {
    const r = toBiradsUsInput([
      obs("breast_us.finding_type", "breast", e("non_mass")),
      obs("breast_us.mass_shape", "breast", null, { status: "not_applicable" }),
      obs("breast_us.mass_orientation", "breast", null, { status: "not_applicable" }),
      obs("breast_us.mass_margin", "breast", null, { status: "not_applicable" }),
      obs("breast_us.echo_pattern", "breast", e("heterogeneous")),
      obs("breast_us.posterior_features", "breast", e("none")),
      obs("breast_us.vascularity", "breast", e("mild")),
    ]);
    assert.ok(!r.ok && r.errors.some((x) => x.code === "unsupported_transformation"));
  });

  it("round-trips including engine not_applicable ↔ status not_applicable", () => {
    const input: BiradsInput = {
      findingType: "mass",
      shape: "irregular",
      margin: "spiculated",
      echoPattern: "hypoechoic",
      vascularity: "marked",
      orientation: "non_parallel",
      posteriorFeatures: "shadowing",
      nonMassEchogenicity: "not_applicable",
      nonMassDistribution: "not_applicable",
      nonMassAssociatedFeatures: "not_applicable",
    };
    const back = fromBiradsUsInput(input, FROM);
    assert.equal(back.lossy.length, 0);
    assert.ok(back.observations.some((o) => o.status === "not_applicable"));
    const again = toBiradsUsInput(back.observations);
    assert.ok(again.ok);
    if (again.ok) assert.deepEqual(again.input, input);
  });

  it("rejects values outside the BI-RADS US lexicon", () => {
    const r = toBiradsUsInput([...mass(), obs("breast_us.vascularity", "breast", e("moderate"))]);
    assert.ok(!r.ok && r.errors.some((x) => x.code === "invalid_observation"));
  });
});

describe("ACR TI-RADS adapter", () => {
  const nodule = () => [
    obs("thyroid.acr_composition", "thyroid", e("solid")),
    obs("thyroid.acr_echogenicity", "thyroid", e("very_hypoechoic")),
    obs("thyroid.acr_shape", "thyroid", e("taller_than_wide")),
    obs("thyroid.acr_margin", "thyroid", e("lobulated_or_irregular")),
    obs("thyroid.acr_echogenic_foci", "thyroid", set("punctate")),
    mm("thyroid.nodule_largest_diameter", "thyroid", 12),
  ];

  it("maps canonical → TiradsAcrInput and the existing engine scores it", () => {
    const r = toTiradsAcrInput(nodule());
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.deepEqual(r.input.echogenicFoci, ["punctate"]);
    assert.equal(evaluateAcrTirads(r.input).category, "TR5");
  });

  it("requires echogenic foci explicitly (no default to none)", () => {
    const r = toTiradsAcrInput(nodule().filter((o) => o.feature !== "thyroid.acr_echogenic_foci"));
    assert.ok(!r.ok && r.missing.includes("thyroid.acr_echogenic_foci"));
  });

  it("SAFETY: missing size blocks (engine would answer fnaRecommended=false for TR3–TR5)", () => {
    const noSize = nodule().filter((o) => o.feature !== "thyroid.nodule_largest_diameter");
    const strict = toTiradsAcrInput(noSize);
    assert.ok(!strict.ok && strict.missing.includes("thyroid.nodule_largest_diameter"));
    const partial = toTiradsAcrInput(noSize, { allowPartial: true });
    assert.ok(partial.ok && partial.completeness === "partial");
  });

  it("maps lymph nodes not_assessed status ↔ engine 'not_assessed' and round-trips", () => {
    const input: TiradsAcrInput = {
      composition: "mixed",
      echogenicity: "hyperechoic_or_isoechoic",
      shape: "wider_than_tall",
      margin: "smooth",
      echogenicFoci: ["macrocalcifications", "peripheral_rim"],
      largestDiameterMm: 18,
      thyroidVolumeMl: 14.2,
      noduleLocation: "правая доля, средняя треть",
      lymphNodes: "not_assessed",
      patternId: "atlas-123",
    };
    const back = fromTiradsAcrInput(input, FROM);
    assert.ok(back.lossy.some((l) => l.engineKey === "patternId"));
    assert.ok(back.observations.some((o) => o.feature === "neck_lymph_nodes.assessment" && o.status === "not_assessed"));
    const again = toTiradsAcrInput(back.observations);
    assert.ok(again.ok);
    if (!again.ok) return;
    const { patternId: _p, ...expected } = input;
    assert.deepEqual(again.input, expected);
  });
});

describe("MUSA adenomyosis adapter", () => {
  const flags = (present: boolean) =>
    [
      "uterus.myometrial_cysts",
      "uterus.hyperechogenic_islands",
      "uterus.subendometrial_lines_buds",
      "uterus.heterogeneous_myometrium",
      "uterus.wall_asymmetry",
      "uterus.globular_shape",
      "uterus.fan_shaped_shadowing",
    ].map((f) => obs(f, "uterus", b(present)));

  it("maps canonical → MUSA input and the existing score runs", () => {
    const r = toMusaAdenomyosisInput([...flags(true), mm("uterus.jz_thickness_max", "uterus", 14)]);
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(calculateAdenomyosisScore(r.input).total, 13);
  });

  it("not_assessed boolean blocks the score instead of becoming false", () => {
    const list = [...flags(false), mm("uterus.jz_thickness_max", "uterus", 9)];
    list[0] = obs("uterus.myometrial_cysts", "uterus", null, { status: "not_assessed" });
    const r = toMusaAdenomyosisInput(list);
    assert.ok(!r.ok && r.missing.includes("uterus.myometrial_cysts"));
  });

  it("SAFETY: absent JZ blocks (engine would count JZ>12 mm as 0 points)", () => {
    const r = toMusaAdenomyosisInput(flags(false));
    assert.ok(!r.ok && r.missing.includes("uterus.jz_thickness_max"));
    assert.ok(!r.ok && r.errors.some((x) => x.code === "incomplete_for_engine"));
  });

  it("SAFETY: not_assessed JZ is still incomplete; allowPartial marks the score partial", () => {
    const list = [...flags(false), obs("uterus.jz_thickness_max", "uterus", null, { status: "not_assessed" })];
    assert.equal(toMusaAdenomyosisInput(list).ok, false);
    const partial = toMusaAdenomyosisInput(list, { allowPartial: true });
    assert.ok(partial.ok && partial.completeness === "partial");
    assert.ok(partial.ok && partial.incompleteFeatures.includes("uterus.jz_thickness_max"));
  });

  it("round-trips assessment input", () => {
    const input: MusaAdenomyosisAssessmentInput = {
      myometrialCysts: true,
      hyperechogenicIslands: false,
      subendometrialStriations: true,
      jzThicknessMm: 13,
      heterogeneousMyometrium: false,
      asymmetry: true,
      globularUterus: false,
      fanShapedShadowing: true,
      localization: ["PW", "FU"],
      depthOfInvasion: "A2",
      morphologicType: "D",
      jzIrregularity: "JZ-II",
      uterineContour: "U1",
      anteriorWallMm: 14,
      posteriorWallMm: 22,
    };
    const back = fromMusaAdenomyosisInput(input, FROM);
    assert.equal(back.lossy.length, 0);
    const again = toMusaAdenomyosisInput(back.observations);
    assert.ok(again.ok);
    if (again.ok) assert.deepEqual(again.input, input);
  });

  it("reports null JZ / empty localization as lossy (not clinical negatives)", () => {
    const back = fromMusaAdenomyosisInput(
      {
        myometrialCysts: false,
        hyperechogenicIslands: false,
        subendometrialStriations: false,
        heterogeneousMyometrium: false,
        asymmetry: false,
        globularUterus: false,
        fanShapedShadowing: false,
        jzThicknessMm: null,
        localization: [],
      },
      FROM,
    );
    assert.deepEqual(back.lossy.map((l) => l.engineKey).sort(), ["jzThicknessMm", "localization"]);
  });
});

describe("AI provenance through adapters", () => {
  it("fromEngine with AI source defaults to suggested, never confirmed", () => {
    const back = fromTiradsAcrInput(
      {
        composition: "solid",
        echogenicity: "hypoechoic",
        shape: "wider_than_tall",
        margin: "smooth",
        echogenicFoci: ["none_or_comet_tail"],
      },
      { source: "ai_vision", timestamp: T },
    );
    assert.ok(back.observations.every((o) => o.status === "suggested" && o.source === "ai_vision"));
    assert.equal(toTiradsAcrInput(back.observations).ok, false);
  });
});
