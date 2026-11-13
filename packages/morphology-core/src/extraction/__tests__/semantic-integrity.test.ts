/**
 * TASK 04.1 regression tests — explicit not_assessed, contradictions, laterality conflicts,
 * papillary vs solid separation, and blocking of conflicting data at the adapters.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ORADS_MUST_STATE_FEATURES, toOradsProInput } from "../../adapters/orads-us";
import { toTiradsAcrInput } from "../../adapters/tirads-acr";
import { defaultFeatureRegistry } from "../../features";
import { acceptObservationStatus, isPendingReview, validateObservation } from "../../observation";
import type { MorphologyObservation } from "../../types";
import { hasNegationCue, hasNotAssessedCue, lateralityCues, locateFragment } from "../text";
import type { MorphologyExtractionResult } from "../types";
import { find, M, run, S, T, unresolvedReasons } from "./helpers";

const results: { name: string; text: string; r: MorphologyExtractionResult }[] = [];
async function runKeep(name: string, text: string, payload: unknown) {
  const r = await run(text, payload);
  results.push({ name, text, r });
  return r;
}
const ev = (r: MorphologyExtractionResult, o?: MorphologyObservation) => r.evidence.find((e) => e.observationId === o?.id);

describe("cue detection", () => {
  it("«не оценивался» family is not-assessed, never negation", () => {
    for (const p of ["Кровоток не оценивался", "Солидный компонент оценить невозможно", "Яичник не исследовался", "Оценка затруднена", "ЦДК не проводилось", "not assessed"]) {
      assert.equal(hasNotAssessedCue(p), true, p);
      assert.equal(hasNegationCue(p), false, p);
    }
    for (const p of ["Кровоток не определяется", "Солидных компонентов не выявлено", "без перегородок"]) {
      assert.equal(hasNotAssessedCue(p), false, p);
      assert.equal(hasNegationCue(p), true, p);
    }
  });

  it("side words only — «правильной формы» is not right; «справа/слева» are sides", () => {
    assert.deepEqual([...lateralityCues("образование правильной формы")], []);
    assert.deepEqual([...lateralityCues("справа")], ["right"]);
    assert.deepEqual([...lateralityCues("слева от матки")], ["left"]);
    assert.deepEqual([...lateralityCues("в левом яичнике")], ["left"]);
  });
});

describe("explicit not_assessed", () => {
  const cases: [string, string, string][] = [
    ["Левый яичник: образование 40 мм. Кровоток не оценивался.", "adnexa.blood_flow", "Кровоток не оценивался"],
    ["Левый яичник: образование 40 мм. Солидный компонент оценить невозможно.", "adnexa.solid_component", "Солидный компонент оценить невозможно"],
    ["Левый яичник: образование 40 мм. Акустическая тень — оценка затруднена.", "adnexa.acoustic_shadows", "Акустическая тень — оценка затруднена"],
    ["Левый яичник: образование 40 мм. Цветовое картирование не исследовалось.", "adnexa.iota_color_score", "Цветовое картирование не исследовалось"],
  ];
  for (const [text, feature, fragment] of cases) {
    it(`«${fragment}» → not_assessed with fragment, not a negative`, async () => {
      const r = await runKeep(`na:${feature}`, text, {
        subjects: [S("S1", "ovary", "left", "Левый яичник")],
        mentions: [M({ featureId: feature, assertion: "not_assessed", sourceText: fragment })],
      });
      const o = find(r, feature);
      assert.equal(o?.status, "not_assessed");
      assert.equal(o?.value, null);
      assert.equal(o?.source, "ai_text_extraction");
      assert.equal(o?.confirmation ?? null, null);
      assert.equal(o?.rawText, fragment);
      assert.deepEqual(ev(r, o)?.assertions, ["not_assessed"]);
      assert.deepEqual(validateObservation(o!, defaultFeatureRegistry), []);
      if (ORADS_MUST_STATE_FEATURES.includes(feature)) {
        assert.ok(r.missingInformation.some((m) => m.featureId === feature && m.reason === "explicitly_not_assessed"));
      } else {
        assert.ok(!r.missingInformation.some((m) => m.featureId === feature), "not an engine must-state feature");
      }
    });
  }

  it("REGRESSION A1: model reading «не оценивался» as a negation → not_assessed, negative discarded", async () => {
    const text = "Левый яичник: образование 40 мм. Кровоток не оценивался.";
    const r = await runKeep("A1", text, {
      subjects: [S("S1", "ovary", "left", "Левый яичник")],
      mentions: [M({ featureId: "adnexa.blood_flow", assertion: "negated", valueCode: "none", sourceText: "Кровоток не оценивался" })],
    });
    const o = find(r, "adnexa.blood_flow");
    assert.equal(o?.status, "not_assessed");
    assert.notDeepEqual(o?.value, { kind: "enum", code: "none" });
    assert.ok(r.ambiguities.some((a) => a.kind === "not_assessed_statement"));
  });

  it("not_assessed without an explicit phrase is rejected (absence ≠ not assessed)", async () => {
    const text = "Левый яичник: образование 40 мм.";
    const r = await runKeep("na-nocue", text, {
      subjects: [S("S1", "ovary", "left", "Левый яичник")],
      mentions: [M({ featureId: "adnexa.blood_flow", assertion: "not_assessed", sourceText: "образование 40 мм" })],
    });
    assert.equal(find(r, "adnexa.blood_flow"), undefined);
    assert.ok(unresolvedReasons(r).includes("not_assessed_without_cue"));
  });

  it("not_assessed carrying a value, or a value from a «not assessed» fragment, is rejected", async () => {
    const text = "Левый яичник: образование 40 мм. Кровоток не оценивался.";
    const r = await runKeep("na-value", text, {
      subjects: [S("S1", "ovary", "left", "Левый яичник")],
      mentions: [
        M({ featureId: "adnexa.blood_flow", assertion: "not_assessed", valueCode: "moderate", sourceText: "Кровоток не оценивался" }),
        M({ featureId: "adnexa.iota_color_score", valueCode: "3", sourceText: "Кровоток не оценивался" }),
      ],
    });
    assert.equal(r.observations.length, 0);
    assert.deepEqual(unresolvedReasons(r), ["inconsistent_not_assessed", "inconsistent_not_assessed"]);
  });

  it("unmentioned feature creates neither not_assessed nor a negative", async () => {
    const text = "Левый яичник: однокамерное образование 40 мм.";
    const r = await runKeep("absent", text, {
      subjects: [S("S1", "ovary", "left", "Левый яичник")],
      mentions: [M({ featureId: "adnexa.structure", valueCode: "unilocular", sourceText: "однокамерное образование" })],
    });
    assert.equal(find(r, "adnexa.blood_flow"), undefined);
    assert.ok(r.missingInformation.some((m) => m.featureId === "adnexa.iota_color_score" && m.reason === "not_mentioned"));
  });

  it("explicit negative stays a negative (not not_assessed)", async () => {
    const text = "Левый яичник: образование 40 мм. Кровоток не определяется.";
    const r = await runKeep("neg", text, {
      subjects: [S("S1", "ovary", "left", "Левый яичник")],
      mentions: [M({ featureId: "adnexa.blood_flow", assertion: "negated", valueCode: "none", sourceText: "Кровоток не определяется" })],
    });
    const o = find(r, "adnexa.blood_flow");
    assert.equal(o?.status, "suggested");
    assert.deepEqual(o?.value, { kind: "enum", code: "none" });
  });
});

describe("contradictory statements", () => {
  it("present vs absent → contradicted, both fragments kept, no value chosen", async () => {
    const text = "Солидный компонент определяется. Солидный компонент не определяется.";
    const r = await runKeep("c-bool", text, {
      subjects: [S("S1", "ovary")],
      mentions: [
        M({ featureId: "adnexa.solid_component", present: true, sourceText: "Солидный компонент определяется" }),
        M({ featureId: "adnexa.solid_component", assertion: "negated", present: false, sourceText: "Солидный компонент не определяется" }),
      ],
    });
    const o = find(r, "adnexa.solid_component");
    assert.equal(o?.status, "contradicted");
    assert.equal(o?.value, null);
    assert.equal(ev(r, o)?.fragments.length, 2);
    assert.deepEqual(ev(r, o)?.assertions, ["affirmed", "negated"]);
  });

  it("35 mm vs 48 mm → contradicted with quantity alternatives (REGRESSION B1)", async () => {
    const text = "Образование 35 мм. При повторном осмотре образование 48 мм.";
    const r = await runKeep("c-size", text, {
      subjects: [S("S1", "ovary")],
      mentions: [
        M({ featureId: "adnexa.lesion_length", measurementText: "35 мм", sourceText: "Образование 35 мм" }),
        M({ featureId: "adnexa.lesion_length", measurementText: "48 мм", sourceText: "образование 48 мм" }),
      ],
    });
    const o = find(r, "adnexa.lesion_length");
    assert.equal(o?.status, "contradicted");
    assert.equal(o?.measurement ?? null, null);
    assert.deepEqual(o?.alternatives, [
      { kind: "quantity", value: 35, unit: "mm" },
      { kind: "quantity", value: 48, unit: "mm" },
    ]);
    assert.equal(ev(r, o)?.measurementText, "35 мм | 48 мм");
    assert.deepEqual(validateObservation(o!, defaultFeatureRegistry), []);
  });

  it("not assessed vs a stated value → contradicted with a not_assessed alternative", async () => {
    const text = "Кровоток не оценивался. При ЦДК кровоток умеренный.";
    const r = await runKeep("c-na", text, {
      subjects: [S("S1", "ovary")],
      mentions: [
        M({ featureId: "adnexa.blood_flow", assertion: "not_assessed", sourceText: "Кровоток не оценивался" }),
        M({ featureId: "adnexa.blood_flow", valueCode: "moderate", sourceText: "При ЦДК кровоток умеренный" }),
      ],
    });
    const o = find(r, "adnexa.blood_flow");
    assert.equal(o?.status, "contradicted");
    assert.deepEqual(o?.alternatives, [{ kind: "not_assessed" }, { kind: "enum", code: "moderate" }]);
  });

  it("right vs left for one finding → side unset + laterality_conflict (REGRESSION B2)", async () => {
    const text = "В правом яичнике киста 30 мм. Киста левого яичника 30 мм с ровным контуром.";
    const r = await runKeep("c-side", text, {
      subjects: [S("S1", "ovary", "right", "правом яичнике")],
      mentions: [
        M({ featureId: "adnexa.lesion_length", measurementText: "30 мм", sourceText: "киста 30 мм" }),
        M({ featureId: "adnexa.solid_component_contour", valueCode: "smooth", sourceText: "Киста левого яичника 30 мм с ровным контуром" }),
      ],
    });
    assert.ok(r.observations.every((o) => o.laterality == null));
    const a = r.ambiguities.find((x) => x.kind === "laterality_conflict");
    assert.ok(a);
    assert.ok(a!.fragments!.includes("правом яичнике"));
  });

  it("laterality phrase naming both sides → unset", async () => {
    const text = "Образование в правом и левом яичнике 20 мм.";
    const r = await runKeep("c-side2", text, {
      subjects: [S("S1", "ovary", "right", "в правом и левом яичнике")],
      mentions: [M({ featureId: "adnexa.lesion_length", measurementText: "20 мм", sourceText: "яичнике 20 мм" })],
    });
    assert.equal(find(r, "adnexa.lesion_length")?.laterality, null);
    assert.ok(r.ambiguities.some((x) => x.kind === "laterality_conflict"));
  });

  it("«правильной формы» does not create a false right/left conflict", async () => {
    const text = "В левом яичнике образование правильной формы 25 мм.";
    const r = await runKeep("c-side3", text, {
      subjects: [S("S1", "ovary", "left", "левом яичнике")],
      mentions: [M({ featureId: "adnexa.lesion_length", measurementText: "25 мм", sourceText: "образование правильной формы 25 мм" })],
    });
    assert.equal(find(r, "adnexa.lesion_length")?.laterality, "left");
    assert.ok(!r.ambiguities.some((x) => x.kind === "laterality_conflict"));
  });
});

describe("papillary projection vs solid component", () => {
  it("REGRESSION C1: papilla is not duplicated into solid component / solid diameter", async () => {
    const text = "В левом яичнике киста с папиллярным разрастанием 6 мм.";
    const r = await runKeep("p-dup", text, {
      subjects: [S("S1", "ovary", "left", "левом яичнике")],
      mentions: [
        M({ featureId: "adnexa.papillary_projection_count", valueCode: "1", sourceText: "папиллярным разрастанием 6 мм" }),
        M({ featureId: "adnexa.solid_component", present: true, sourceText: "папиллярным разрастанием 6 мм" }),
        M({ featureId: "adnexa.largest_solid_component_diameter", measurementText: "6 мм", sourceText: "папиллярным разрастанием 6 мм" }),
      ],
    });
    assert.deepEqual(find(r, "adnexa.papillary_projection_count")?.value, { kind: "enum", code: "1" });
    assert.equal(find(r, "adnexa.solid_component"), undefined);
    assert.equal(find(r, "adnexa.largest_solid_component_diameter"), undefined);
    assert.equal(unresolvedReasons(r).filter((x) => x === "concept_mismatch").length, 2);
    assert.ok(r.missingInformation.some((m) => m.featureId === "adnexa.solid_component"), "physician must state it");
  });

  it("REGRESSION C2: «пристеночный компонент» is neither solid nor papillary by default", async () => {
    const text = "Киста левого яичника с пристеночным компонентом 8 мм.";
    const r = await runKeep("p-mural", text, {
      subjects: [S("S1", "ovary", "left", "левого яичника")],
      mentions: [
        M({ featureId: "adnexa.solid_component", present: true, sourceText: "пристеночным компонентом 8 мм" }),
        M({ featureId: "adnexa.papillary_projection_count", valueCode: "1", sourceText: "пристеночным компонентом 8 мм" }),
      ],
    });
    assert.equal(r.observations.length, 0);
    assert.deepEqual(unresolvedReasons(r), ["concept_mismatch", "concept_mismatch"]);
    assert.ok(r.unresolvedMentions.every((u) => u.text === "пристеночным компонентом 8 мм"));
  });

  it("explicit «солидный компонент» is accepted", async () => {
    const text = "Киста левого яичника с солидным компонентом 12 мм.";
    const r = await runKeep("p-solid", text, {
      subjects: [S("S1", "ovary", "left", "левого яичника")],
      mentions: [
        M({ featureId: "adnexa.solid_component", present: true, sourceText: "с солидным компонентом" }),
        M({ featureId: "adnexa.largest_solid_component_diameter", measurementText: "12 мм", sourceText: "солидным компонентом 12 мм" }),
      ],
    });
    assert.ok(find(r, "adnexa.solid_component"));
    assert.equal(find(r, "adnexa.largest_solid_component_diameter")?.measurement, 12);
  });
});

describe("conflicting data never reaches classification adapters", () => {
  const phys = (feature: string, anatomy: MorphologyObservation["anatomy"], extra: Partial<MorphologyObservation>): MorphologyObservation => ({
    id: `p:${feature}`,
    anatomy,
    feature,
    value: null,
    status: "confirmed",
    source: "physician_input",
    timestamp: T,
    ...extra,
  });
  const e = (code: string) => ({ kind: "enum" as const, code });
  const b = (present: boolean) => ({ kind: "boolean" as const, present });
  const stated = () => [
    phys("adnexa.lesion_kind", "adnexa", { value: e("nonphysiological") }),
    phys("adnexa.structure", "adnexa", { value: e("unilocular") }),
    phys("adnexa.lesion_width", "adnexa", { measurement: 30, unit: "mm" }),
    phys("adnexa.cyst_content_echogenicity", "adnexa", { value: e("anechoic") }),
    phys("adnexa.solid_component", "adnexa", { value: b(false) }),
    phys("adnexa.solid_component_contour", "adnexa", { value: e("smooth") }),
    phys("adnexa.papillary_projection_count", "adnexa", { value: e("0") }),
    phys("adnexa.acoustic_shadows", "adnexa", { value: b(false) }),
    phys("adnexa.iota_color_score", "adnexa", { value: e("1") }),
    phys("pelvis.ascites", "pelvis", { value: b(false) }),
    phys("pelvis.peritoneal_nodules", "pelvis", { value: b(false) }),
  ];

  it("baseline fully stated lesion converts", () => {
    const r = toOradsProInput(stated(), { menopause: "post" });
    assert.ok(r.ok && r.completeness === "complete");
  });

  it("REGRESSION D: a contradicted optional feature blocks the whole conversion", () => {
    const list = [
      ...stated(),
      phys("adnexa.blood_flow", "adnexa", { status: "contradicted", alternatives: [e("none"), e("marked")] }),
    ];
    for (const opts of [{}, { allowPartial: true }, { allowPartial: true, acceptStatuses: ["confirmed", "suggested", "uncertain"] as const }]) {
      const r = toOradsProInput(list, { menopause: "post" }, { ...opts, acceptStatuses: opts.acceptStatuses ? [...opts.acceptStatuses] : undefined });
      assert.ok(!r.ok && r.errors.some((x) => x.code === "contradicted"), JSON.stringify(opts));
    }
  });

  it("contradicted size (quantity alternatives) blocks even when another dimension is present", () => {
    const list = [
      ...stated(),
      phys("adnexa.lesion_length", "adnexa", {
        status: "contradicted",
        alternatives: [
          { kind: "quantity", value: 35, unit: "mm" },
          { kind: "quantity", value: 48, unit: "mm" },
        ],
      }),
    ];
    const r = toOradsProInput(list, { menopause: "post" }, { allowPartial: true });
    assert.ok(!r.ok && r.errors.some((x) => x.code === "contradicted"));
  });

  it("laterality conflict within one finding blocks", () => {
    const list = stated().map((o, i) => ({ ...o, laterality: i === 0 ? ("right" as const) : ("left" as const) }));
    const r = toOradsProInput(list, { menopause: "post" });
    assert.ok(!r.ok && r.errors.some((x) => x.code === "laterality_conflict"));
  });

  it("papillae with solid component = false is flagged (engine would discard the papillae)", () => {
    const list = stated().map((o) => (o.feature === "adnexa.papillary_projection_count" ? { ...o, value: e("2") } : o));
    const r = toOradsProInput(list, { menopause: "post" }, { allowPartial: true });
    assert.ok(!r.ok && r.errors.some((x) => x.code === "inconsistent_features"));
  });

  it("AI not_assessed pending review does not reach the engine; physician acceptance makes it usable", () => {
    const base = [
      phys("thyroid.acr_composition", "thyroid", { value: e("solid") }),
      phys("thyroid.acr_echogenicity", "thyroid", { value: e("hypoechoic") }),
      phys("thyroid.acr_shape", "thyroid", { value: e("wider_than_tall") }),
      phys("thyroid.acr_margin", "thyroid", { value: e("smooth") }),
      phys("thyroid.acr_echogenic_foci", "thyroid", { value: { kind: "enum_set", codes: ["none_or_comet_tail"] } }),
      phys("thyroid.nodule_largest_diameter", "thyroid", { measurement: 14, unit: "mm" }),
    ];
    const aiLymph: MorphologyObservation = {
      id: "ai:ln",
      anatomy: "neck_lymph_nodes",
      feature: "neck_lymph_nodes.assessment",
      value: null,
      status: "not_assessed",
      source: "ai_text_extraction",
      timestamp: T,
      rawText: "Лимфоузлы не оценивались",
    };
    assert.equal(isPendingReview(aiLymph), true);
    const strict = toTiradsAcrInput([...base, aiLymph]);
    assert.ok(strict.ok);
    if (strict.ok) assert.equal("lymphNodes" in strict.input, false);

    const accepted = acceptObservationStatus(aiLymph, T);
    assert.equal(isPendingReview(accepted), false);
    assert.equal(accepted.status, "not_assessed");
    const after = toTiradsAcrInput([...base, accepted]);
    assert.ok(after.ok && after.input.lymphNodes === "not_assessed");
  });
});

describe("contract: alternative-only kinds", () => {
  const o = (extra: Partial<MorphologyObservation>): MorphologyObservation => ({
    id: "k",
    anatomy: "adnexa",
    feature: "adnexa.lesion_length",
    value: null,
    status: "contradicted",
    source: "ai_text_extraction",
    timestamp: T,
    ...extra,
  });
  const codes = (x: MorphologyObservation) => validateObservation(x, defaultFeatureRegistry).map((i) => i.code);

  it("quantity / not_assessed are rejected as `value`", () => {
    assert.ok(codes(o({ status: "suggested", value: { kind: "quantity", value: 35, unit: "mm" } })).includes("alternative_only_kind"));
    assert.ok(codes(o({ status: "suggested", value: { kind: "not_assessed" } })).includes("alternative_only_kind"));
  });

  it("alternatives require contradicted; quantity alternatives must use the feature unit", () => {
    assert.ok(codes(o({ status: "uncertain", measurement: 3, unit: "mm", alternatives: [{ kind: "quantity", value: 1, unit: "mm" }, { kind: "quantity", value: 2, unit: "mm" }] })).includes("value_forbidden"));
    assert.ok(codes(o({ alternatives: [{ kind: "quantity", value: 35, unit: "cm" }, { kind: "quantity", value: 48, unit: "mm" }] })).includes("unit_mismatch"));
    assert.deepEqual(codes(o({ alternatives: [{ kind: "quantity", value: 35, unit: "mm" }, { kind: "not_assessed" }] })), []);
  });

  it("acceptObservationStatus refuses value statuses", () => {
    assert.throws(() => acceptObservationStatus(o({ status: "suggested", measurement: 3, unit: "mm" }), T));
  });
});

describe("TASK 04.1 invariants across all new results", () => {
  it("no confirmed, every fragment present in text, every observation contract-valid", () => {
    assert.ok(results.length >= 15);
    for (const { name, text, r } of results) {
      for (const o of r.observations) {
        assert.notEqual(o.status, "confirmed", name);
        assert.deepEqual(validateObservation(o, defaultFeatureRegistry), [], `${name}: ${o.feature}`);
        for (const f of ev(r, o)!.fragments) assert.ok(locateFragment(text, f.text), `${name}: ${f.text}`);
      }
      for (const u of r.unresolvedMentions) assert.ok(u.text.length > 0, `${name}: ${u.reason}`);
    }
  });

  it("extraction output never feeds an engine without physician review", () => {
    for (const { r } of results) {
      const out = toOradsProInput(r.observations, { menopause: "pre" }, { allowPartial: true });
      if (out.ok) assert.deepEqual(out.usedObservationIds, []);
    }
  });
});
