import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calculateOradsResult } from "../src/calculateOradsResult";
import { mapExtractedToHints, parseAndMapOradsHints, parseOradsProtocolText } from "../src/extractedToHints";
import { oradsNavigatorReducer, ORADS_NAVIGATOR_INITIAL_STATE } from "../src/navigator/reducer";
import { resolveOradsNavigatorView } from "../src/navigator/resolveView";

const DICTATIONS = [
  {
    id: 1,
    text: "Образование в правом яичнике 45x32x28 мм, солидный компонент, кровоток по ЦДК определяется, асцита нет",
    expect: {
      diameterMm: 45,
      solidComponent: true,
      vascularity: "moderate" as const,
      ascites: "absent" as const,
      ovarySide: "right" as const,
    },
  },
  {
    id: 2,
    text: "Киста левого яичника 60x45x40 мм, гладкие контуры, анэхогенная, без перегородок, ЦДК отрицательный",
    expect: {
      diameterMm: 60,
      contour: "smooth" as const,
      echogenicity: "anechoic" as const,
      septations: "none" as const,
      vascularity: "none" as const,
      lesionClass: "simple" as const,
    },
  },
  {
    id: 3,
    text: "Мультифолликулярные яичники, объём правого 12 см3, левого 15 см3, без образований",
    expect: {
      noFocalLesion: true,
      lesionClass: "normal" as const,
    },
    category: 1,
  },
  {
    id: 4,
    text: "Образование правого яичника 38x28x22 мм, солидное, с неровными контурами, кровоток усилен, асцит +",
    expect: {
      diameterMm: 38,
      lesionClass: "solid" as const,
      contour: "irregular" as const,
      vascularity: "high" as const,
      ascites: "present" as const,
    },
    category: 5,
  },
  {
    id: 5,
    text: "Париетальное образование яичника 50x40 мм, сложная киста с толстой перегородкой, кровоток в перегородке, асцита нет",
    expect: {
      diameterMm: 50,
      lesionClass: "nonsimple" as const,
      septations: "thick" as const,
      vascularity: "moderate" as const,
      ascites: "absent" as const,
    },
  },
  {
    id: 6,
    text: "Солидное образование левого яичника 30x25x20 мм, неоднородной структуры, с кровотоком, асцит присутствует",
    expect: {
      diameterMm: 30,
      lesionClass: "solid" as const,
      echogenicity: "heterogeneous" as const,
      vascularity: "moderate" as const,
      ascites: "present" as const,
    },
  },
  {
    id: 7,
    text: "Анэхогенное образование 20x18 мм в правом яичнике, тонкая стенка, без кровотока, без перегородок",
    expect: {
      diameterMm: 20,
      echogenicity: "anechoic" as const,
      contour: "smooth" as const,
      vascularity: "none" as const,
      septations: "none" as const,
    },
  },
  {
    id: 8,
    text: "Образование яичника 70x55x50 мм, солидный компонент 15 мм, кровоток определяется, асцит есть, перегородки утолщены",
    expect: {
      diameterMm: 70,
      solidComponent: true,
      solidComponentMm: 15,
      vascularity: "moderate" as const,
      ascites: "present" as const,
      septations: "thick" as const,
    },
  },
  {
    id: 9,
    text: "Киста левого яичника 40x35x30 мм, с внутренними перегородками, кровоток по ЦДК отсутствует, асцита нет",
    expect: {
      diameterMm: 40,
      septations: "thin" as const,
      vascularity: "none" as const,
      ascites: "absent" as const,
      lesionClass: "nonsimple" as const,
    },
  },
  {
    id: 10,
    text: "Мультикистозные яичники, множественные мелкие образования до 8 мм, без кровотока",
    expect: {
      diameterMm: 8,
      locularity: "multilocular" as const,
      vascularity: "none" as const,
    },
  },
] as const;

describe("parseOradsProtocolText", () => {
  for (const sample of DICTATIONS) {
    it(`extracts key fields for dictation #${sample.id}`, () => {
      const parsed = parseOradsProtocolText(sample.text);
      for (const [key, value] of Object.entries(sample.expect)) {
        assert.equal(
          parsed[key as keyof typeof parsed],
          value,
          `#${sample.id}: expected ${key}=${String(value)}, got ${String(parsed[key as keyof typeof parsed])}`,
        );
      }
    });
  }
});

describe("mapExtractedToHints", () => {
  it("resolves normal ovary to O-RADS 1", () => {
    const mapped = parseAndMapOradsHints(DICTATIONS[2]!.text, { menopause: "pre" });
    assert.ok(mapped.completePath);
    assert.equal(mapped.categoryNumber, 1);
    const calc = calculateOradsResult(mapped.completePath!);
    assert.equal(calc.ok && calc.result.categoryNumber, 1);
  });

  it("resolves solid irregular + ascites to O-RADS 5", () => {
    const mapped = parseAndMapOradsHints(DICTATIONS[3]!.text, { menopause: "pre" });
    assert.ok(mapped.completePath);
    assert.equal(mapped.categoryNumber, 5);
  });

  it("resolves simple anechoic cyst 60mm to O-RADS 2", () => {
    const mapped = parseAndMapOradsHints(DICTATIONS[1]!.text, { menopause: "pre" });
    assert.ok(mapped.completePath, "expected complete wizard path");
    assert.equal(mapped.categoryNumber, 2);
  });

  it("flags ascites modifier when base category < 5", () => {
    const extracted = parseOradsProtocolText(DICTATIONS[0]!.text);
    extracted.ascites = "present";
    const mapped = mapExtractedToHints(extracted);
    if (mapped.categoryNumber !== null && mapped.categoryNumber < 5) {
      assert.equal(mapped.ascitesModifierSuggested, true);
    }
  });

  it("apply_hints reducer walks wizard from hints", () => {
    const mapped = parseAndMapOradsHints(DICTATIONS[2]!.text, { menopause: "pre" });
    assert.ok(mapped.hints.length > 0);

    let state = ORADS_NAVIGATOR_INITIAL_STATE;
    state = oradsNavigatorReducer(state, {
      type: "apply_hints",
      hints: mapped.hints,
      autoPickHigh: true,
    });

    const view = resolveOradsNavigatorView(state);
    assert.equal(view.kind, "result");
    if (view.kind === "result") assert.equal(view.result.categoryNumber, 1);
  });
});
