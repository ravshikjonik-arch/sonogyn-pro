import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

import { collectOradsTreeLocaleKeys } from "./treeWalker";
import { flattenLocaleKeys, getNestedLocaleValue } from "./localeUtils";

const __dirname = dirname(fileURLToPath(import.meta.url));
const localesDir = join(__dirname, "..", "locales");

const WIZARD_META_KEYS = [
  "orads.meta.title",
  "orads.meta.disclaimer",
  "orads.meta.rtl",
  "orads.wizard.title",
  "orads.wizard.step_of",
] as const;

function loadLocale(code: string): { orads: Record<string, unknown> } {
  return JSON.parse(readFileSync(join(localesDir, `${code}.json`), "utf8")) as {
    orads: Record<string, unknown>;
  };
}

describe("O-RADS locale bundles (nested orads namespace)", () => {
  const treeKeys = collectOradsTreeLocaleKeys();
  const requiredKeys = [...new Set([...treeKeys, ...WIZARD_META_KEYS])].sort();

  for (const code of ["ru", "en", "es", "fr", "ar"] as const) {
    it(`${code}.json covers all tree i18n keys`, () => {
      const bundle = loadLocale(code);
      const flat = flattenLocaleKeys(bundle.orads, "orads");
      const missing = requiredKeys.filter((key) => !flat.includes(key));
      assert.deepEqual(missing, [], `missing keys in ${code}: ${missing.join(", ")}`);
      for (const key of requiredKeys) {
        const value = getNestedLocaleValue(bundle.orads, key);
        assert.ok(value && value.length > 0, `empty value for ${key} in ${code}`);
      }
    });
  }

  it("ar.json marks RTL metadata", () => {
    const ar = loadLocale("ar");
    assert.equal(getNestedLocaleValue(ar.orads, "orads.meta.rtl"), "true");
  });

  it("locale files use nested orads root", () => {
    for (const code of ["ru", "en", "es", "fr", "ar"] as const) {
      const bundle = loadLocale(code);
      assert.ok(bundle.orads && typeof bundle.orads === "object");
      assert.ok(!("orads.meta.title" in (bundle as unknown as Record<string, unknown>)));
    }
  });
});
