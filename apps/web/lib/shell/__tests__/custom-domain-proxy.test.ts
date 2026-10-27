import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { customDomainBootstrapDocument, resolveDeploymentOrigin } from "../custom-domain-proxy";
import { CUSTOM_DOMAIN_HTML_BYTE_BUDGET, isSonogynCustomDomainHost } from "../custom-domain";

describe("custom domain shell", () => {
  it("detects sonogyn hosts", () => {
    assert.equal(isSonogynCustomDomainHost("sonogyn-pro.ru"), true);
    assert.equal(isSonogynCustomDomainHost("www.sonogyn-pro.ru"), true);
    assert.equal(isSonogynCustomDomainHost("sonogyn-pro-web.vercel.app"), false);
  });

  it("keeps the custom-domain loader under the Cloudflare cutoff", () => {
    const html = customDomainBootstrapDocument("https://sonogyn-pro-web-ravshan-s-projects3.vercel.app");
    assert.ok(html.includes("Загрузка кабинета"));
    assert.ok(html.includes("sonogyn-pro-web-ravshan-s-projects3.vercel.app"));
    assert.ok(new TextEncoder().encode(html).length < CUSTOM_DOMAIN_HTML_BYTE_BUDGET);
    assert.equal(html.includes("<script"), true);
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
