import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { isSonogynCustomDomainHost } from "../custom-domain";
import { customDomainHandoffGate, isDomainHandoffEnabled } from "../custom-domain-handoff";
import { resolveDeploymentOrigin } from "../custom-domain-proxy";

function gate(opts: {
  host: string;
  path?: string;
  search?: string;
  method?: string;
  headers?: Record<string, string>;
  enabled?: boolean;
  authRequired?: boolean;
}) {
  return customDomainHandoffGate({
    enabled: opts.enabled ?? true,
    method: opts.method ?? "GET",
    pathname: opts.path ?? "/profile/dashboard",
    search: opts.search ?? "",
    headers: new Headers({ host: opts.host, ...opts.headers }),
    authRequired: opts.authRequired ?? true,
  });
}

const envKeys = ["SONOGYN_DOMAIN_HANDOFF", "SONOGYN_EXTRA_CUSTOM_DOMAIN_HOSTS", "SONOGYN_DEPLOYMENT_ORIGIN", "SONOGYN_ASSET_PREFIX", "VERCEL_ENV", "VERCEL_URL"];
const saved = Object.fromEntries(envKeys.map((k) => [k, process.env[k]]));
afterEach(() => {
  for (const k of envKeys) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("custom domain login handoff gate", () => {
  it("is off unless the flag is exactly 1", () => {
    delete process.env.SONOGYN_DOMAIN_HANDOFF;
    assert.equal(isDomainHandoffEnabled(), false);
    process.env.SONOGYN_DOMAIN_HANDOFF = "true";
    assert.equal(isDomainHandoffEnabled(), false);
    process.env.SONOGYN_DOMAIN_HANDOFF = "1";
    assert.equal(isDomainHandoffEnabled(), true);
  });

  it("does nothing when disabled, for public pages and for writes", () => {
    assert.equal(gate({ host: "sonogyn-pro.ru", enabled: false }), null);
    assert.equal(gate({ host: "sonogyn-pro.ru", path: "/tools/calc/rads/o-rads", authRequired: false }), null);
    assert.equal(gate({ host: "sonogyn-pro.ru", method: "POST" }), null);
  });

  it("sends a page visit on the custom domain to the handoff start, keeping the path", () => {
    assert.deepEqual(gate({ host: "sonogyn-pro.ru", search: "?tab=chat" }), {
      kind: "start",
      location: "/auth/handoff/start?next=%2Fprofile%2Fdashboard%3Ftab%3Dchat",
    });
    assert.equal(gate({ host: "www.sonogyn-pro.ru", method: "HEAD" })?.kind, "start");
  });

  it("turns a router request on the custom domain into a full page load", () => {
    assert.deepEqual(gate({ host: "sonogyn-pro.ru", headers: { RSC: "1" } }), { kind: "reload" });
    assert.deepEqual(gate({ host: "sonogyn-pro.ru", headers: { "next-router-prefetch": "1" } }), { kind: "reload" });
  });

  it("fails router requests from the custom domain to the deployment host", () => {
    const host = "sonogyn-pro-web-ravshan-s-projects3.vercel.app";
    assert.deepEqual(gate({ host, headers: { RSC: "1", origin: "https://sonogyn-pro.ru" } }), {
      kind: "block-cross-origin",
    });
    assert.equal(gate({ host, headers: { RSC: "1", origin: `https://${host}` } }), null);
    assert.equal(gate({ host, headers: { RSC: "1" } }), null);
    assert.equal(gate({ host, headers: { origin: "https://sonogyn-pro.ru" } }), null);
  });

  it("treats configured extra hosts like the custom domain", () => {
    assert.equal(isSonogynCustomDomainHost("test.sonogyn-pro.ru"), false);
    process.env.SONOGYN_EXTRA_CUSTOM_DOMAIN_HOSTS = " Test.Sonogyn-Pro.ru ,other.example";
    assert.equal(isSonogynCustomDomainHost("test.sonogyn-pro.ru"), true);
    assert.equal(gate({ host: "test.sonogyn-pro.ru" })?.kind, "start");
    assert.equal(isSonogynCustomDomainHost("evil-sonogyn-pro.ru"), false);
  });
});

describe("deployment origin for the custom domain", () => {
  it("uses the shared asset host only in production", () => {
    delete process.env.SONOGYN_DEPLOYMENT_ORIGIN;
    process.env.SONOGYN_ASSET_PREFIX = "https://sonogyn-pro-web-ravshan-s-projects3.vercel.app/";
    process.env.VERCEL_URL = "sonogyn-pro-abc123-ravshan-s-projects3.vercel.app";

    process.env.VERCEL_ENV = "production";
    assert.equal(resolveDeploymentOrigin(), "https://sonogyn-pro-web-ravshan-s-projects3.vercel.app");

    process.env.VERCEL_ENV = "preview";
    assert.equal(resolveDeploymentOrigin(), "https://sonogyn-pro-abc123-ravshan-s-projects3.vercel.app");
  });
});
