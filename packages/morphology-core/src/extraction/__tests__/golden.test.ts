/**
 * Golden cases for AI text extraction. The model is replaced by fixed responses —
 * including deliberately unsafe ones — so the deterministic acceptance layer is tested.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { toOradsProInput } from "../../adapters/orads-us";
import { defaultFeatureRegistry } from "../../features";
import { validateObservation } from "../../observation";
import type { MorphologyExtractionResult } from "../types";
import { hasNotAssessedCue, locateFragment } from "../text";
import { find, M, run, S, unresolvedReasons } from "./helpers";

const all: { name: string; text: string; result: MorphologyExtractionResult }[] = [];
const keep = (name: string, text: string, result: MorphologyExtractionResult) => {
  all.push({ name, text, result });
  return result;
};

describe("golden: adnexal lesions", () => {
  it("01 simple ovarian cyst", async () => {
    const text = "Левый яичник: однокамерное анэхогенное образование 35 мм с ровным внутренним контуром.";
    const r = keep("01", text, await run(text, {
      subjects: [S("S1", "ovary", "left", "Левый яичник")],
      mentions: [
        M({ featureId: "adnexa.structure", valueCode: "unilocular", sourceText: "однокамерное" }),
        M({ featureId: "adnexa.cyst_content_echogenicity", valueCode: "anechoic", sourceText: "анэхогенное" }),
        M({ featureId: "adnexa.lesion_length", measurementText: "35 мм", sourceText: "образование 35 мм" }),
        M({ featureId: "adnexa.solid_component_contour", valueCode: "smooth", sourceText: "ровным внутренним контуром" }),
      ],
    }));
    assert.equal(r.validationStatus, "valid");
    assert.equal(r.observations.length, 4);
    assert.ok(r.observations.every((o) => o.status === "suggested" && o.source === "ai_text_extraction"));
    assert.ok(r.observations.every((o) => o.laterality === "left"));
    assert.equal(find(r, "adnexa.lesion_length")?.measurement, 35);
    assert.equal(find(r, "adnexa.solid_component"), undefined, "not mentioned → no observation");
    assert.ok(r.missingInformation.some((m) => m.featureId === "adnexa.solid_component" && m.reason === "not_mentioned"));
    assert.ok(r.missingInformation.some((m) => m.featureId === "context.menopause"));
  });

  it("02 lesion with septations — separate observations per feature", async () => {
    const text = "В правом яичнике многокамерное образование 52×40×33 мм с тонкими перегородками, более 3.";
    const r = keep("02", text, await run(text, {
      subjects: [S("S1", "ovary", "right", "правом яичнике")],
      mentions: [
        M({ featureId: "adnexa.structure", valueCode: "multilocular", sourceText: "многокамерное образование" }),
        M({ featureId: "adnexa.lesion_length", measurementText: "52", sourceText: "52×40×33 мм" }),
        M({ featureId: "adnexa.lesion_width", measurementText: "40", sourceText: "52×40×33 мм" }),
        M({ featureId: "adnexa.lesion_height", measurementText: "33", sourceText: "52×40×33 мм" }),
        M({ featureId: "adnexa.septa_thickness", valueCode: "thin", sourceText: "тонкими перегородками" }),
        M({ featureId: "adnexa.septa_count", valueCode: ">3", sourceText: "более 3" }),
      ],
    }));
    assert.equal(r.validationStatus, "valid");
    assert.deepEqual(
      [find(r, "adnexa.lesion_length")?.measurement, find(r, "adnexa.lesion_width")?.measurement, find(r, "adnexa.lesion_height")?.measurement],
      [52, 40, 33],
    );
    assert.deepEqual(find(r, "adnexa.septa_thickness")?.value, { kind: "enum", code: "thin" });
    assert.deepEqual(find(r, "adnexa.septa_count")?.value, { kind: "enum", code: ">3" });
    assert.equal(r.observations.length, 6);
  });

  it("03 lesion with solid component", async () => {
    const text = "Образование левого яичника с солидным компонентом 18 мм.";
    const r = keep("03", text, await run(text, {
      subjects: [S("S1", "ovary", "left", "левого яичника")],
      mentions: [
        M({ featureId: "adnexa.solid_component", present: true, sourceText: "с солидным компонентом" }),
        M({ featureId: "adnexa.largest_solid_component_diameter", measurementText: "18 мм", sourceText: "солидным компонентом 18 мм" }),
      ],
    }));
    assert.deepEqual(find(r, "adnexa.solid_component")?.value, { kind: "boolean", present: true });
    assert.equal(find(r, "adnexa.largest_solid_component_diameter")?.measurement, 18);
  });

  it("04 papillary projections", async () => {
    const text = "В левом яичнике кистозное образование с папиллярными разрастаниями (2) с неровной поверхностью.";
    const r = keep("04", text, await run(text, {
      subjects: [S("S1", "ovary", "left", "левом яичнике")],
      mentions: [
        M({ featureId: "adnexa.papillary_projection_count", valueCode: "2", sourceText: "папиллярными разрастаниями (2)" }),
        M({ featureId: "adnexa.papillary_projection_surface", valueCode: "irregular", sourceText: "папиллярными разрастаниями (2) с неровной поверхностью" }),
      ],
    }));
    assert.deepEqual(find(r, "adnexa.papillary_projection_count")?.value, { kind: "enum", code: "2" });
    assert.deepEqual(find(r, "adnexa.papillary_projection_surface")?.value, { kind: "enum", code: "irregular" });
  });

  it("05 explicit negation of solid component is kept as a suggested negative", async () => {
    const text = "Однокамерное образование правого яичника 28 мм. Солидных компонентов не выявлено.";
    const r = keep("05", text, await run(text, {
      subjects: [S("S1", "ovary", "right", "правого яичника")],
      mentions: [
        M({ featureId: "adnexa.solid_component", assertion: "negated", present: false, sourceText: "Солидных компонентов не выявлено" }),
      ],
    }));
    const o = find(r, "adnexa.solid_component");
    assert.deepEqual(o?.value, { kind: "boolean", present: false });
    assert.equal(o?.status, "suggested");
    assert.deepEqual(r.evidence.find((e) => e.observationId === o?.id)?.assertions, ["negated"]);
  });

  it("06 hedged papillary component stays uncertain even if the model says affirmed", async () => {
    const text = "В левом яичнике образование. Возможно, имеется папиллярный компонент.";
    const r = keep("06", text, await run(text, {
      subjects: [S("S1", "ovary", "left", "левом яичнике")],
      mentions: [
        M({ featureId: "adnexa.papillary_projection_count", valueCode: "1", sourceText: "Возможно, имеется папиллярный компонент", extractionConfidence: 0.98 }),
      ],
    }));
    const o = find(r, "adnexa.papillary_projection_count");
    assert.equal(o?.status, "uncertain");
    assert.equal(o?.rawText, "Возможно, имеется папиллярный компонент");
    assert.ok(r.ambiguities.some((a) => a.kind === "hedged_statement"));
    assert.ok(r.missingInformation.some((m) => m.featureId === "adnexa.papillary_projection_count" && m.reason === "needs_clarification"));
  });

  it("07 unmentioned blood flow / solid component are never generated (adversarial model)", async () => {
    const text = "Левый яичник: однокамерное образование 30 мм.";
    const r = keep("07", text, await run(text, {
      subjects: [S("S1", "ovary", "left", "Левый яичник")],
      mentions: [
        M({ featureId: "adnexa.structure", valueCode: "unilocular", sourceText: "однокамерное образование" }),
        M({ featureId: "adnexa.blood_flow", assertion: "negated", valueCode: "none", sourceText: "кровоток не определяется" }),
        M({ featureId: "adnexa.solid_component", present: false, sourceText: "однокамерное образование" }),
        M({ featureId: "adnexa.papillary_projection_count", valueCode: "0", sourceText: "однокамерное образование" }),
      ],
    }));
    assert.equal(find(r, "adnexa.blood_flow"), undefined);
    assert.equal(find(r, "adnexa.solid_component"), undefined);
    assert.equal(find(r, "adnexa.papillary_projection_count"), undefined);
    // Fabricated negatives are rejected: quoted text absent, or the fragment does not even name the concept.
    assert.deepEqual(unresolvedReasons(r).sort(), ["concept_mismatch", "concept_mismatch", "source_not_found_in_text"]);
    assert.equal(r.validationStatus, "valid_with_issues");
    assert.ok(r.missingInformation.some((m) => m.featureId === "adnexa.iota_color_score"));
  });

  it("08 left and right ovaries are separate subjects", async () => {
    const text = "В левом яичнике простая киста 30 мм. В правом яичнике эндометриома 42 мм.";
    const r = keep("08", text, await run(text, {
      subjects: [S("S1", "ovary", "left", "левом яичнике"), S("S2", "ovary", "right", "правом яичнике")],
      mentions: [
        M({ subjectRef: "S1", featureId: "adnexa.unilocular_subtype", valueCode: "simple_cyst", sourceText: "простая киста" }),
        M({ subjectRef: "S1", featureId: "adnexa.lesion_length", measurementText: "30 мм", sourceText: "простая киста 30 мм" }),
        M({ subjectRef: "S2", featureId: "adnexa.unilocular_subtype", valueCode: "endometrioma", sourceText: "эндометриома" }),
        M({ subjectRef: "S2", featureId: "adnexa.lesion_length", measurementText: "42 мм", sourceText: "эндометриома 42 мм" }),
      ],
    }));
    assert.equal(find(r, "adnexa.lesion_length", "S1")?.measurement, 30);
    assert.equal(find(r, "adnexa.lesion_length", "S1")?.laterality, "left");
    assert.equal(find(r, "adnexa.lesion_length", "S2")?.measurement, 42);
    assert.equal(find(r, "adnexa.lesion_length", "S2")?.laterality, "right");
    assert.ok(!r.observations.some((o) => o.status === "contradicted"));
  });

  it("09 mm / cm / m normalize to the same physical value; raw text kept", async () => {
    const text = "Киста левого яичника 35 мм. Киста правого яичника 3,5 см. Параовариальная киста 0,035 м.";
    const r = keep("09", text, await run(text, {
      subjects: [S("S1", "ovary", "left", "левого яичника"), S("S2", "ovary", "right", "правого яичника"), S("S3", "adnexa")],
      mentions: [
        M({ subjectRef: "S1", featureId: "adnexa.lesion_length", measurementText: "35 мм", sourceText: "Киста левого яичника 35 мм" }),
        M({ subjectRef: "S2", featureId: "adnexa.lesion_length", measurementText: "3,5 см", sourceText: "Киста правого яичника 3,5 см" }),
        M({ subjectRef: "S3", featureId: "adnexa.lesion_length", measurementText: "0,035 м", sourceText: "Параовариальная киста 0,035 м" }),
      ],
    }));
    for (const s of ["S1", "S2", "S3"]) {
      const o = find(r, "adnexa.lesion_length", s);
      assert.equal(o?.measurement, 35, `${s} → 35 mm`);
      assert.equal(o?.unit, "mm");
    }
    const ev = (s: string) => r.evidence.find((e) => e.observationId === find(r, "adnexa.lesion_length", s)?.id);
    assert.equal(ev("S2")?.measurementText, "3,5 см");
    assert.equal(ev("S3")?.measurementText, "0,035 м");
    assert.equal(find(r, "adnexa.lesion_length", "S3")?.laterality, null, "no side stated for S3");
  });

  it("10 several lesions in one ovary stay distinct (no false contradiction)", async () => {
    const text = "В левом яичнике два образования: первое однокамерное 20 мм, второе многокамерное 25 мм.";
    const r = keep("10", text, await run(text, {
      subjects: [S("S1", "ovary", "left", "левом яичнике"), S("S2", "ovary", "left", "левом яичнике")],
      mentions: [
        M({ subjectRef: "S1", featureId: "adnexa.structure", valueCode: "unilocular", sourceText: "первое однокамерное" }),
        M({ subjectRef: "S1", featureId: "adnexa.lesion_length", measurementText: "20 мм", sourceText: "однокамерное 20 мм" }),
        M({ subjectRef: "S2", featureId: "adnexa.structure", valueCode: "multilocular", sourceText: "второе многокамерное" }),
        M({ subjectRef: "S2", featureId: "adnexa.lesion_length", measurementText: "25 мм", sourceText: "многокамерное 25 мм" }),
      ],
    }));
    assert.equal(r.subjects.filter((s) => s.site === "ovary").length, 2);
    assert.deepEqual(find(r, "adnexa.structure", "S1")?.value, { kind: "enum", code: "unilocular" });
    assert.deepEqual(find(r, "adnexa.structure", "S2")?.value, { kind: "enum", code: "multilocular" });
    assert.ok(!r.observations.some((o) => o.status === "contradicted"));
  });
});

describe("golden: anatomy separation", () => {
  it("11 uterus and endometrium: endometrium is not mapped onto myometrial features", async () => {
    const text = "Матка шаровидной формы, в миометрии мелкие кисты. Эндометрий 12 мм, однородный.";
    const r = keep("11", text, await run(text, {
      subjects: [S("U1", "uterus"), S("E1", "endometrium")],
      mentions: [
        M({ subjectRef: "U1", featureId: "uterus.globular_shape", site: "uterus", present: true, sourceText: "Матка шаровидной формы" }),
        M({ subjectRef: "U1", featureId: "uterus.myometrial_cysts", site: "myometrium", present: true, sourceText: "в миометрии мелкие кисты" }),
        M({ subjectRef: "E1", featureId: null, site: "endometrium", note: "endometrial thickness — no registered feature", sourceText: "Эндометрий 12 мм" }),
        M({ subjectRef: "E1", featureId: "uterus.jz_thickness_max", site: "endometrium", measurementText: "12 мм", sourceText: "Эндометрий 12 мм" }),
      ],
    }));
    assert.deepEqual(find(r, "uterus.globular_shape")?.value, { kind: "boolean", present: true });
    assert.deepEqual(find(r, "uterus.myometrial_cysts")?.value, { kind: "boolean", present: true });
    assert.equal(find(r, "uterus.jz_thickness_max"), undefined);
    assert.ok(r.unresolvedMentions.some((u) => u.reason === "model_unmapped" && u.text === "Эндометрий 12 мм"));
    assert.ok(r.unresolvedMentions.some((u) => u.reason === "anatomy_mismatch" && u.proposedFeatureId === "uterus.jz_thickness_max"));
    assert.ok(r.observations.every((o) => o.laterality == null), "uterus has no laterality");
    assert.ok(r.missingInformation.some((m) => m.subjectRef === "U1" && m.featureId === "uterus.jz_thickness_max"));
    assert.ok(!r.missingInformation.some((m) => m.subjectRef === "E1"));
  });

  it("12 mixed structures: ascites is pelvic, uterine feature cannot sit on the ovary", async () => {
    const text = "Левый яичник: однокамерная киста 30 мм. В малом тазу асцит. Матка шаровидной формы.";
    const r = keep("12", text, await run(text, {
      subjects: [S("S1", "ovary", "left", "Левый яичник"), S("U1", "uterus")],
      mentions: [
        M({ subjectRef: "S1", featureId: "adnexa.structure", valueCode: "unilocular", sourceText: "однокамерная киста" }),
        M({ subjectRef: "S1", featureId: "pelvis.ascites", site: "pelvis", present: true, sourceText: "В малом тазу асцит" }),
        M({ subjectRef: "S1", featureId: "uterus.globular_shape", present: true, sourceText: "Матка шаровидной формы" }),
        M({ subjectRef: "U1", featureId: "uterus.globular_shape", present: true, sourceText: "Матка шаровидной формы" }),
      ],
    }));
    assert.equal(find(r, "pelvis.ascites")?.laterality, null, "ascites does not inherit the ovary side");
    assert.equal(find(r, "adnexa.structure")?.laterality, "left");
    assert.ok(find(r, "uterus.globular_shape", "U1"));
    assert.equal(find(r, "uterus.globular_shape", "S1"), undefined);
    assert.ok(r.unresolvedMentions.some((u) => u.reason === "anatomy_mismatch"));
  });

  it("12b laterality not supported by the text is not invented", async () => {
    const text = "Образование яичника 25 мм.";
    const r = keep("12b", text, await run(text, {
      subjects: [S("S1", "ovary", "left", null)],
      mentions: [M({ featureId: "adnexa.lesion_length", measurementText: "25 мм", sourceText: "Образование яичника 25 мм" })],
    }));
    assert.equal(find(r, "adnexa.lesion_length")?.laterality, null);
    assert.ok(r.ambiguities.some((a) => a.kind === "laterality_unverified"));
  });
});

describe("golden: conflicts, unknown terms, damaged input", () => {
  it("13 contradictory statements become one contradicted observation", async () => {
    const text = "Солидный компонент не определяется. По задней стенке солидный компонент 7 мм.";
    const r = keep("13", text, await run(text, {
      subjects: [S("S1", "ovary")],
      mentions: [
        M({ featureId: "adnexa.solid_component", assertion: "negated", present: false, sourceText: "Солидный компонент не определяется" }),
        M({ featureId: "adnexa.solid_component", present: true, sourceText: "По задней стенке солидный компонент 7 мм" }),
      ],
    }));
    const o = find(r, "adnexa.solid_component");
    assert.equal(o?.status, "contradicted");
    assert.equal(o?.value, null);
    assert.deepEqual(o?.alternatives, [
      { kind: "boolean", present: false },
      { kind: "boolean", present: true },
    ]);
    assert.ok(r.ambiguities.some((a) => a.kind === "conflicting_values"));
    const engine = toOradsProInput(r.observations, { menopause: "pre" }, { allowPartial: true, acceptStatuses: ["confirmed", "suggested", "uncertain"] });
    assert.ok(!engine.ok || !("solidComponent" in engine.input), "contradiction never reaches the engine");
  });

  it("14 unknown medical term is preserved, registry is not extended", async () => {
    const text = "В левом яичнике образование с симптомом «огненного кольца».";
    const r = keep("14", text, await run(text, {
      subjects: [S("S1", "ovary", "left", "левом яичнике")],
      mentions: [
        M({ featureId: "adnexa.ring_of_fire", present: true, sourceText: "симптомом «огненного кольца»" }),
        M({ featureId: null, note: "ring of fire sign — no feature", sourceText: "симптомом «огненного кольца»" }),
      ],
    }));
    assert.equal(r.observations.length, 0);
    const unknown = r.unresolvedMentions.find((u) => u.reason === "unknown_feature");
    assert.equal(unknown?.proposedFeatureId, "adnexa.ring_of_fire");
    assert.equal(unknown?.text, "симптомом «огненного кольца»");
    assert.ok(r.unresolvedMentions.some((u) => u.reason === "model_unmapped"));
    assert.equal(defaultFeatureRegistry.has("adnexa.ring_of_fire"), false);
  });

  it("15a broken model JSON → invalid, nothing reaches engines", async () => {
    const text = "Левый яичник: киста 30 мм.";
    const r = keep("15a", text, await run(text, '{"subjects": [ {"ref": "S1", '));
    assert.equal(r.validationStatus, "invalid");
    assert.equal(r.observations.length, 0);
  });

  it("15b damaged text: number without unit is not guessed", async () => {
    const text = "Лев яич обр 3";
    const r = keep("15b", text, await run(text, {
      subjects: [S("S1", "ovary", "left", "Лев")],
      mentions: [M({ featureId: "adnexa.lesion_length", measurementText: "3", sourceText: "обр 3" })],
    }));
    assert.equal(find(r, "adnexa.lesion_length"), undefined);
    assert.ok(unresolvedReasons(r).includes("unit_unparsed"));
  });

  it("15c model attempting to set status=confirmed is rejected, text preserved", async () => {
    const text = "Левый яичник: однокамерная киста 30 мм.";
    const bad = { ...M({ featureId: "adnexa.structure", valueCode: "unilocular", sourceText: "однокамерная киста" }), status: "confirmed" };
    const r = keep("15c", text, await run(text, { subjects: [S("S1", "ovary", "left", "Левый яичник")], mentions: [bad] }));
    assert.equal(find(r, "adnexa.structure"), undefined);
    const u = r.unresolvedMentions.find((x) => x.reason === "schema_violation");
    assert.match(u?.detail ?? "", /status/);
    assert.equal(u?.text, "однокамерная киста");
    assert.equal(r.validationStatus, "valid_with_issues");
  });
});

describe("golden invariants (all cases)", () => {
  it("AI never returns confirmed; source is always ai_text_extraction", () => {
    assert.ok(all.length >= 15);
    for (const { name, result } of all) {
      for (const o of result.observations) {
        assert.notEqual(o.status, "confirmed", `${name}: ${o.feature}`);
        assert.equal(o.source, "ai_text_extraction", `${name}: ${o.feature}`);
        assert.equal(o.confirmation ?? null, null, `${name}: ${o.feature}`);
      }
    }
  });

  it("never not_applicable; not_assessed only with an explicit «not assessed» phrase (absence stays absence)", () => {
    for (const { name, result } of all) {
      for (const o of result.observations) {
        assert.notEqual(o.status, "not_applicable", name);
        if (o.status === "not_assessed") {
          const ev = result.evidence.find((e) => e.observationId === o.id)!;
          assert.ok(ev.fragments.every((f) => hasNotAssessedCue(f.text)), `${name}: ${o.feature}`);
        }
      }
    }
  });

  it("every observation is contract-valid and its source fragments occur in the input", () => {
    for (const { name, text, result } of all) {
      for (const o of result.observations) {
        assert.deepEqual(validateObservation(o, defaultFeatureRegistry), [], `${name}: ${o.feature}`);
        const ev = result.evidence.find((e) => e.observationId === o.id);
        assert.ok(ev && ev.fragments.length > 0, `${name}: evidence for ${o.feature}`);
        for (const f of ev!.fragments) assert.ok(locateFragment(text, f.text), `${name}: "${f.text}" in text`);
      }
    }
  });

  it("negative values always come with a negation cue", () => {
    for (const { name, result } of all) {
      for (const o of result.observations) {
        if (o.value?.kind === "boolean" && o.value.present === false) {
          const ev = result.evidence.find((e) => e.observationId === o.id)!;
          assert.ok(ev.assertions.includes("negated"), `${name}: ${o.feature}`);
        }
      }
    }
  });

  it("high extraction confidence does not imply confirmation or engine input", () => {
    for (const { result } of all) {
      const strict = toOradsProInput(result.observations, { menopause: "pre" }, { allowPartial: true });
      if (strict.ok) assert.deepEqual(strict.usedObservationIds, [], "suggested observations never feed engines by default");
    }
  });

  it("unknown / rejected mentions keep their source text", () => {
    for (const { name, result } of all) {
      for (const u of result.unresolvedMentions) assert.ok(u.text.length > 0, `${name}: ${u.reason}`);
    }
  });
});
