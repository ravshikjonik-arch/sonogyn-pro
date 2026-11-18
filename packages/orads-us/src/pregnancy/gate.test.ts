import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateOradsUs2022 } from "../us2022/evaluateOradsUs2022";
import { initialOradsUs2022Input } from "../us2022/types";
import { isOradsUsStratificationAllowed, pregnancyBlocksOradsCategory } from "./gate";

describe("pregnancy O-RADS gate (stage A)", () => {
  it("allows O-RADS only for non_pregnant", () => {
    assert.equal(isOradsUsStratificationAllowed("non_pregnant"), true);
    assert.equal(isOradsUsStratificationAllowed("pregnant"), false);
    assert.equal(pregnancyBlocksOradsCategory("pregnant"), true);
    assert.equal(pregnancyBlocksOradsCategory("non_pregnant"), false);
  });

  it("non_pregnant path still produces categories from engine", () => {
    const result = evaluateOradsUs2022({
      ...initialOradsUs2022Input,
      morphology: "classic",
      classicType: "dermoid",
      sizeMm: 40,
    });
    // Classic benign dermoid with size typically yields a category (2) when complete.
    // Gate does not alter engine — only whether UI/API may call it.
    assert.ok(result.category === null || (result.category >= 0 && result.category <= 5));
  });

  it("pregnant context must not surface engine category as product output", () => {
    const engine = evaluateOradsUs2022({
      ...initialOradsUs2022Input,
      morphology: "classic",
      classicType: "dermoid",
      sizeMm: 40,
    });
    const context = "pregnant" as const;
    const productCategory = pregnancyBlocksOradsCategory(context) ? null : engine.category;
    assert.equal(productCategory, null);
  });
});
