import assert from "node:assert/strict";
import test from "node:test";

import { getPwaOfflinePrecachePaths } from "../offline-precache-routes";

const FORBIDDEN_SNIPPETS = ["/api/", "/auth/", "/profile/patients", "supabase.co"];

test("precache list includes O-RADS and offline shell", () => {
  const paths = getPwaOfflinePrecachePaths();
  assert.ok(paths.includes("/tools/calc/rads/o-rads"));
  assert.ok(paths.includes("/offline"));
  assert.ok(paths.includes("/home"));
});

test("precache list excludes network-only API/auth routes", () => {
  const paths = getPwaOfflinePrecachePaths();
  for (const path of paths) {
    for (const bad of FORBIDDEN_SNIPPETS) {
      assert.ok(!path.includes(bad), `unexpected precache path ${path} contains ${bad}`);
    }
  }
});

test("precache entry count within soft budget", () => {
  const paths = getPwaOfflinePrecachePaths();
  const max = Number(process.env.PWA_PRECACHE_MAX_ENTRIES ?? "120");
  assert.ok(
    paths.length <= max,
    `precache has ${paths.length} entries (max ${max}); trim registry or raise PWA_PRECACHE_MAX_ENTRIES`,
  );
});
