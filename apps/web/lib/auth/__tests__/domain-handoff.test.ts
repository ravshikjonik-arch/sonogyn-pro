import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DOMAIN_HANDOFF_TTL_SEC,
  HandoffCodeSchema,
  memoryHandoffStore,
  newHandoffCode,
  planHandoffComplete,
  planHandoffStart,
  type HandoffStartDeps,
  type HandoffStore,
} from "../domain-handoff";

const USER = { id: "8f9d2c1a-3b4e-4f5a-9b6c-7d8e9f0a1b2c", email: "doctor@example.test" };

function startDeps(overrides: Partial<HandoffStartDeps> = {}): HandoffStartDeps {
  return {
    getUser: async () => USER,
    hasVerifiedMfa: async () => false,
    createTokenHash: async () => "token-hash-1",
    store: memoryHandoffStore(),
    ...overrides,
  };
}

function completeDeps(store: HandoffStore, verified: string | null = USER.id) {
  const calls = { verified: [] as string[], signOut: 0 };
  return {
    calls,
    deps: {
      store,
      verifyTokenHash: async (tokenHash: string) => {
        calls.verified.push(tokenHash);
        return verified;
      },
      signOut: async () => {
        calls.signOut += 1;
      },
    },
  };
}

async function issue(store: HandoffStore, next = "/profile/dashboard"): Promise<string> {
  const outcome = await planHandoffStart(startDeps({ store }), next);
  assert.equal(outcome.kind, "handoff");
  return outcome.kind === "handoff" ? outcome.code : "";
}

describe("domain handoff code", () => {
  it("is 43 url-safe characters and unique", () => {
    const a = newHandoffCode();
    assert.ok(HandoffCodeSchema.safeParse(a).success);
    assert.notEqual(a, newHandoffCode());
  });
});

describe("planHandoffStart", () => {
  it("asks a signed-out visitor to sign in on the custom domain", async () => {
    assert.deepEqual(await planHandoffStart(startDeps({ getUser: async () => null }), "/profile"), {
      kind: "login",
      next: "/profile",
    });
  });

  it("never carries over an account with MFA", async () => {
    let minted = 0;
    const outcome = await planHandoffStart(
      startDeps({ hasVerifiedMfa: async () => true, createTokenHash: async () => `t${++minted}` }),
      "/profile",
    );
    assert.deepEqual(outcome, { kind: "direct", next: "/profile", reason: "mfa" });
    assert.equal(minted, 0);
  });

  it("falls back to signing in on the deployment host when it cannot issue a code", async () => {
    assert.equal((await planHandoffStart(startDeps({ getUser: async () => ({ id: USER.id }) }), "/p")).kind, "direct");
    assert.deepEqual(await planHandoffStart(startDeps({ store: null }), "/p"), { kind: "direct", next: "/p", reason: "no_store" });
    assert.deepEqual(await planHandoffStart(startDeps({ createTokenHash: async () => null }), "/p"), {
      kind: "direct",
      next: "/p",
      reason: "no_token",
    });
  });

  it("rejects redirects to other sites", async () => {
    for (const next of ["//evil.example/x", "https://evil.example", "/\\evil.example"]) {
      const outcome = await planHandoffStart(startDeps({ getUser: async () => null }), next);
      assert.equal(outcome.kind, "login");
      assert.ok(outcome.kind === "login" && outcome.next.startsWith("/") && !outcome.next.startsWith("//"));
    }
  });
});

describe("planHandoffComplete", () => {
  it("signs in once and returns to the requested page", async () => {
    const store = memoryHandoffStore();
    const code = await issue(store, "/profile/dashboard?tab=chat");
    const { deps, calls } = completeDeps(store);

    assert.deepEqual(await planHandoffComplete(deps, code), { kind: "ok", next: "/profile/dashboard?tab=chat" });
    assert.deepEqual(calls.verified, ["token-hash-1"]);
    assert.deepEqual(await planHandoffComplete(deps, code), { kind: "failed" });
    assert.equal(calls.verified.length, 1);
  });

  it("expires after the TTL", async () => {
    let now = 1_000_000;
    const store = memoryHandoffStore(() => now);
    const code = await issue(store);
    now += (DOMAIN_HANDOFF_TTL_SEC + 1) * 1000;
    assert.deepEqual(await planHandoffComplete(completeDeps(store).deps, code), { kind: "failed" });
  });

  it("rejects unknown, malformed and missing codes without touching the session", async () => {
    const store = memoryHandoffStore();
    await issue(store);
    const { deps, calls } = completeDeps(store);
    for (const code of [newHandoffCode(), "short", "", null, "x".repeat(43) + "!"]) {
      assert.deepEqual(await planHandoffComplete(deps, code), { kind: "failed" });
    }
    assert.equal(calls.verified.length, 0);
  });

  it("fails when Supabase rejects the token", async () => {
    const store = memoryHandoffStore();
    const code = await issue(store);
    assert.deepEqual(await planHandoffComplete(completeDeps(store, null).deps, code), { kind: "failed" });
  });

  it("signs out if the token belongs to another user", async () => {
    const store = memoryHandoffStore();
    const code = await issue(store);
    const { deps, calls } = completeDeps(store, "00000000-0000-4000-8000-000000000000");
    assert.deepEqual(await planHandoffComplete(deps, code), { kind: "failed" });
    assert.equal(calls.signOut, 1);
  });

  it("fails without a store and ignores tampered stored values", async () => {
    const code = newHandoffCode();
    assert.deepEqual(await planHandoffComplete({ ...completeDeps(memoryHandoffStore()).deps, store: null }, code), {
      kind: "failed",
    });
    const tampered: HandoffStore = { put: async () => true, take: async () => ({ tokenHash: "t", userId: "not-a-uuid", next: "/" }) };
    assert.deepEqual(await planHandoffComplete(completeDeps(tampered).deps, code), { kind: "failed" });
  });
});
