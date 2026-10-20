import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveDeploymentOrigin } from "../custom-domain-proxy";
import { isSonogynCustomDomainHost } from "../custom-domain";

describe("custom domain shell", () => {
  it("detects sonogyn hosts", () => {
    assert.equal(isSonogynCustomDomainHost("sonogyn-pro.ru"), true);
    assert.equal(isSonogynCustomDomainHost("www.sonogyn-pro.ru"), true);
    assert.equal(isSonogynCustomDomainHost("sonogyn-pro-web.vercel.app"), false);
  });

  it("prefers explicit deployment origin env", () => {
    const prev = process.env.SONOGYN_DEPLOYMENT_ORIGIN;
    process.env.SONOGYN_DEPLOYMENT_ORIGIN = "https://example.vercel.app";
    try {
      assert.equal(resolveDeploymentOrigin(), "https://example.vercel.app");
    } finally {
      if (prev === undefined) delete process.env.SONOGYN_DEPLOYMENT_ORIGIN;
      else process.env.SONOGYN_DEPLOYMENT_ORIGIN = prev;
    }
  });
});
