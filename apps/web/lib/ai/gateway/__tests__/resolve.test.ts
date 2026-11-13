import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { isColibriEnabled, llmSupportsJsonObjectMode, resolveProviderChain } from "../resolve";

const KEYS = [
  "LLM_PROVIDER",
  "LLM_FALLBACK_ORDER",
  "LLM_STRICT_PROVIDER",
  "COLIBRI_ENABLED",
  "COLIBRI_MODEL",
  "COLIBRI_VISION_MODEL",
  "COLIBRI_BASE_URL",
  "COLIBRI_API_KEY",
  "PERPLEXITY_API_KEY",
  "PERPLEXITY_MODEL",
  "OPENROUTER_API_KEY",
  "OPENROUTER_ORADS_MODEL",
] as const;

const snapshot: Record<string, string | undefined> = {};

function clearEnv() {
  for (const k of KEYS) {
    snapshot[k] = process.env[k];
    delete process.env[k];
  }
}

afterEach(() => {
  for (const k of KEYS) {
    const v = snapshot[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

describe("AI Gateway resolveProviderChain", () => {
  it("defaults cloud-first; Colibri remains optional last when enabled", () => {
    clearEnv();
    process.env.COLIBRI_MODEL = "glm-local";
    process.env.COLIBRI_ENABLED = "true";
    process.env.OPENROUTER_API_KEY = "or-key";
    process.env.PERPLEXITY_API_KEY = "px-key";
    const chain = resolveProviderChain("evidence");
    assert.equal(chain[0]?.provider, "openrouter");
    assert.ok(chain.some((c) => c.provider === "perplexity"));
    assert.equal(chain[chain.length - 1]?.provider, "colibri");
    assert.equal(chain[chain.length - 1]?.isLocal, true);
  });

  it("does not include Colibri when only COLIBRI_MODEL is set (prod-safe default off)", () => {
    clearEnv();
    process.env.COLIBRI_MODEL = "qwen36-35b";
    process.env.OPENROUTER_API_KEY = "or-key";
    assert.equal(isColibriEnabled(), false);
    const chain = resolveProviderChain("text");
    assert.ok(!chain.some((c) => c.provider === "colibri"));
    assert.equal(chain[0]?.provider, "openrouter");
  });

  it("does not include Colibri when COLIBRI_ENABLED=false", () => {
    clearEnv();
    process.env.COLIBRI_ENABLED = "false";
    process.env.COLIBRI_MODEL = "glm-local";
    process.env.LLM_FALLBACK_ORDER = "colibri,openrouter";
    process.env.OPENROUTER_API_KEY = "or-key";
    const chain = resolveProviderChain("text");
    assert.ok(!chain.some((c) => c.provider === "colibri"));
    assert.equal(chain[0]?.provider, "openrouter");
  });

  it("respects colibri-first when enabled + LLM_FALLBACK_ORDER (doctor-box)", () => {
    clearEnv();
    process.env.COLIBRI_ENABLED = "true";
    process.env.LLM_FALLBACK_ORDER = "colibri,openrouter,perplexity";
    process.env.COLIBRI_MODEL = "glm-local";
    process.env.OPENROUTER_API_KEY = "or-key";
    const chain = resolveProviderChain("text");
    assert.equal(chain[0]?.provider, "colibri");
    assert.equal(chain[1]?.provider, "openrouter");
  });

  it("respects LLM_FALLBACK_ORDER", () => {
    clearEnv();
    process.env.LLM_FALLBACK_ORDER = "openrouter,perplexity";
    process.env.OPENROUTER_API_KEY = "or-key";
    process.env.PERPLEXITY_API_KEY = "px-key";
    process.env.COLIBRI_MODEL = "glm-local";
    const chain = resolveProviderChain("text");
    assert.deepEqual(
      chain.map((c) => c.provider),
      ["openrouter", "perplexity"],
    );
  });

  it("skips Colibri for vision without COLIBRI_VISION_MODEL even when enabled", () => {
    clearEnv();
    process.env.COLIBRI_ENABLED = "true";
    process.env.COLIBRI_MODEL = "glm-local";
    process.env.OPENROUTER_API_KEY = "or-key";
    const chain = resolveProviderChain("vision");
    assert.ok(!chain.some((c) => c.provider === "colibri"));
    assert.equal(chain[0]?.provider, "openrouter");
  });

  it("LLM_PROVIDER=colibri enables slot without COLIBRI_ENABLED", () => {
    clearEnv();
    process.env.LLM_PROVIDER = "colibri";
    process.env.COLIBRI_MODEL = "glm-local";
    process.env.OPENROUTER_API_KEY = "or-key";
    assert.equal(isColibriEnabled(), true);
    const chain = resolveProviderChain("text");
    assert.equal(chain[0]?.provider, "colibri");
  });

  it("json object mode for openrouter and colibri only", () => {
    assert.equal(llmSupportsJsonObjectMode("openrouter"), true);
    assert.equal(llmSupportsJsonObjectMode("colibri"), true);
    assert.equal(llmSupportsJsonObjectMode("perplexity"), false);
  });
});
