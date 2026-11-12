import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { defaultFeatureRegistry } from "../features";
import {
  confirmObservation,
  parseObservations,
  serializeObservations,
  validateObservation,
} from "../observation";
import { createFeatureRegistry } from "../registry";
import { MORPHOLOGY_STATUSES, type MorphologyObservation } from "../types";
import { b, e, obs, T } from "./fixtures";

const reg = defaultFeatureRegistry;
const codes = (o: MorphologyObservation) => validateObservation(o, reg).map((i) => i.code);

describe("MorphologyObservation serialization", () => {
  it("round-trips through JSON without loss", () => {
    const list: MorphologyObservation[] = [
      obs("adnexa.structure", "adnexa", e("multilocular"), {
        laterality: "left",
        plane: "sagittal",
        classificationContext: ["orads_us_pro"],
        definitionVersion: "1.0.0",
        rawText: "многокамерное",
      }),
      obs("adnexa.lesion_length", "adnexa", null, { measurement: 45, unit: "mm" }),
      obs("adnexa.solid_component", "adnexa", b(true), {
        status: "suggested",
        source: "ai_text_extraction",
        confidence: { score: 0.72, method: "model_self_report" },
      }),
    ];
    const parsed = parseObservations(serializeObservations(list), reg);
    assert.equal(parsed.ok, true);
    if (parsed.ok) assert.deepEqual(parsed.observations, list);
  });

  it("rejects malformed JSON and non-observations", () => {
    assert.equal(parseObservations("{", reg).ok, false);
    assert.equal(parseObservations(JSON.stringify([{ foo: 1 }]), reg).ok, false);
  });
});

describe("six statuses", () => {
  it("exposes exactly six statuses", () => {
    assert.deepEqual([...MORPHOLOGY_STATUSES].sort(), [
      "confirmed",
      "contradicted",
      "not_applicable",
      "not_assessed",
      "suggested",
      "uncertain",
    ]);
  });

  it("confirmed requires a value", () => {
    assert.deepEqual(codes(obs("adnexa.solid_component", "adnexa", null)), ["value_required"]);
  });

  it("suggested requires a value and an AI/imported source", () => {
    assert.ok(codes(obs("adnexa.solid_component", "adnexa", b(true), { status: "suggested" })).includes(
      "suggested_requires_unconfirmed_source",
    ));
    assert.deepEqual(
      codes(obs("adnexa.solid_component", "adnexa", b(true), { status: "suggested", source: "ai_vision" })),
      [],
    );
  });

  it("uncertain may carry or omit a candidate value", () => {
    assert.deepEqual(codes(obs("adnexa.solid_component", "adnexa", null, { status: "uncertain" })), []);
    assert.deepEqual(codes(obs("adnexa.solid_component", "adnexa", b(true), { status: "uncertain" })), []);
  });

  it("not_assessed and not_applicable must not carry a value", () => {
    assert.deepEqual(codes(obs("adnexa.solid_component", "adnexa", null, { status: "not_assessed" })), []);
    assert.deepEqual(codes(obs("adnexa.septa_count", "adnexa", null, { status: "not_applicable" })), []);
    assert.deepEqual(codes(obs("adnexa.solid_component", "adnexa", b(false), { status: "not_assessed" })), [
      "value_forbidden",
    ]);
  });

  it("contradicted needs ≥2 alternatives and no winner", () => {
    assert.deepEqual(codes(obs("adnexa.solid_component", "adnexa", null, { status: "contradicted" })), [
      "alternatives_required",
    ]);
    assert.deepEqual(
      codes(
        obs("adnexa.solid_component", "adnexa", null, {
          status: "contradicted",
          alternatives: [b(true), b(false)],
        }),
      ),
      [],
    );
    assert.ok(
      codes(
        obs("adnexa.solid_component", "adnexa", b(true), {
          status: "contradicted",
          alternatives: [b(true), b(false)],
        }),
      ).includes("value_forbidden"),
    );
  });
});

describe("absent value vs negative finding", () => {
  it("confirmed negative is valid and distinct from not_assessed", () => {
    const negative = obs("adnexa.papillary_projection_count", "adnexa", e("0"));
    const notAssessed = obs("adnexa.papillary_projection_count", "adnexa", null, { status: "not_assessed" });
    assert.deepEqual(codes(negative), []);
    assert.deepEqual(codes(notAssessed), []);
    assert.notDeepEqual(negative.value, notAssessed.value);
    assert.notEqual(negative.status, notAssessed.status);
  });
});

describe("provenance and uncertainty", () => {
  it("AI observation cannot be confirmed without explicit physician confirmation", () => {
    const ai = obs("adnexa.solid_component", "adnexa", b(true), {
      source: "ai_text_extraction",
      confidence: { score: 0.99, method: "model_logprob" },
    });
    assert.deepEqual(codes(ai), ["confirmation_required"]);
  });

  it("confirmObservation keeps provenance and confidence, adds confirmation", () => {
    const suggested = obs("adnexa.solid_component", "adnexa", b(true), {
      status: "suggested",
      source: "ai_text_extraction",
      confidence: { score: 0.6, method: "model_self_report" },
    });
    const confirmed = confirmObservation(suggested, T);
    assert.equal(confirmed.source, "ai_text_extraction");
    assert.deepEqual(confirmed.confidence, suggested.confidence);
    assert.deepEqual(confirmed.confirmation, { by: "physician", at: T });
    assert.deepEqual(codes(confirmed), []);
  });

  it("uncertain status survives serialization", () => {
    const u = obs("adnexa.solid_component", "adnexa", b(true), { status: "uncertain" });
    const parsed = parseObservations(serializeObservations([u]), reg);
    assert.equal(parsed.ok && parsed.observations[0]!.status, "uncertain");
  });

  it("rejects confidence outside [0,1], wrong unit, unknown feature, anatomy mismatch", () => {
    assert.ok(
      codes(obs("adnexa.solid_component", "adnexa", b(true), { confidence: { score: 1.4, method: "rule_match" } }))
        .includes("confidence_out_of_range"),
    );
    assert.deepEqual(codes(obs("adnexa.lesion_length", "adnexa", null, { measurement: 4.5, unit: "cm" })), [
      "unit_mismatch",
    ]);
    assert.deepEqual(codes(obs("adnexa.unknown_x", "adnexa", b(true))), ["unknown_feature"]);
    assert.deepEqual(codes(obs("adnexa.solid_component", "breast", b(true))), ["anatomy_mismatch"]);
  });
});

describe("feature registry", () => {
  it("is extensible without changing the base contract", () => {
    const extended = reg.extend([
      {
        featureId: "breast_mmg.calcification_morphology",
        displayName: "MMG calcifications (future)",
        anatomy: "breast",
        valueType: "enum",
        allowedValues: [{ code: "fine_pleomorphic", label: "Fine pleomorphic" }],
        applicableClassifications: ["birads_mmg"],
        definitionVersion: "0.1.0",
        sourceReference: { label: "ACR BI-RADS Mammography" },
      },
    ]);
    assert.equal(extended.has("breast_mmg.calcification_morphology"), true);
    assert.equal(reg.has("breast_mmg.calcification_morphology"), false);
  });

  it("rejects duplicates and incomplete definitions", () => {
    assert.throws(() => reg.extend([reg.get("adnexa.structure")!]));
    assert.throws(() =>
      createFeatureRegistry([
        {
          featureId: "x.q",
          displayName: "q",
          anatomy: "adnexa",
          valueType: "quantity",
          applicableClassifications: [],
          definitionVersion: "1",
          sourceReference: { label: "x" },
        },
      ]),
    );
  });

  it("keeps BI-RADS US and ACR TI-RADS namespaces separate", () => {
    const thyroid = reg.list({ classification: "tirads_acr" });
    assert.ok(thyroid.length > 0);
    assert.ok(thyroid.every((d) => !d.applicableClassifications.includes("tirads_ru")));
    assert.ok(reg.list({ classification: "birads_us" }).every((d) => d.featureId.startsWith("breast_us.")));
    assert.equal(reg.list({ classification: "birads_mmg" }).length, 0);
  });
});
