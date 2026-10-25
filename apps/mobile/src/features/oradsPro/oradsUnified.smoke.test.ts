import { evaluateOradsUs2022, initialOradsUs2022Input } from "@repo/orads-us/pro";

function expectEq(name: string, actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(`${name}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

/** Parity with web e2e orads-pro-grid-smoke (engine-only mobile path). */
function run() {
  const r1 = evaluateOradsUs2022({
    ...initialOradsUs2022Input,
    morphology: "unilocular",
    menopause: "pre",
    sizeCm: 3,
    cystContent: "simple",
    innerContour: "smooth",
    solidComponent: false,
  });
  expectEq("unilocular-pre-3cm", r1.category, 1);

  const r2 = evaluateOradsUs2022({
    ...initialOradsUs2022Input,
    morphology: "bilocular",
    sizeCm: 5,
  });
  expectEq("bilocular-5cm", r2.category, 2);

  const r3 = evaluateOradsUs2022({
    ...initialOradsUs2022Input,
    morphology: "unilocular",
    sizeCm: 4,
    extraSigns: "ascites",
    solidComponent: false,
    innerContour: "smooth",
    cystContent: "simple",
    menopause: "pre",
  });
  expectEq("unilocular-ascites", r3.category, 5);

  const r0 = evaluateOradsUs2022({
    ...initialOradsUs2022Input,
    incomplete: true,
    morphology: "unilocular",
  });
  expectEq("incomplete", r0.category, 0);

  console.log("oradsUnified.smoke: ok");
}

run();
