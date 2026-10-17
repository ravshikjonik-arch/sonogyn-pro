import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import {
  EMR_API_ROUTE_PREFIXES,
  EMR_OWNER_SCOPED_TABLES,
  EMR_PATIENT_DETAIL_OWNER_FILTERS,
  EMR_PATIENT_LIST_OWNER_FILTER,
  TEACHING_API_ROUTE_PREFIXES,
} from "../emr-scope";

const WEB_ROOT = path.join(process.cwd());

function readApiRoute(relativePath: string): string {
  const full = path.join(WEB_ROOT, relativePath);
  return fs.readFileSync(full, "utf8");
}

describe("emr-scope constants", () => {
  it("lists EMR tables separately from teaching routes", () => {
    assert.ok(EMR_OWNER_SCOPED_TABLES.includes("patients"));
    assert.ok(EMR_OWNER_SCOPED_TABLES.includes("studies"));
    assert.ok(TEACHING_API_ROUTE_PREFIXES.includes("/api/cases"));
    const emrRoutes: readonly string[] = EMR_API_ROUTE_PREFIXES;
    assert.ok(!emrRoutes.includes("/api/cases"));
  });

  it("documents owner filter contract strings", () => {
    assert.match(EMR_PATIENT_LIST_OWNER_FILTER, /created_by/);
    for (const f of EMR_PATIENT_DETAIL_OWNER_FILTERS) {
      assert.ok(f.length > 0);
    }
  });
});

describe("EMR API handlers — static owner-scope contract", () => {
  it("GET /api/patients filters by created_by", () => {
    const src = readApiRoute("app/api/patients/route.ts");
    assert.match(src, /\.eq\("created_by", user\.id\)/);
  });

  it("GET /api/patients/[patientId] filters by created_by", () => {
    const src = readApiRoute("app/api/patients/[patientId]/route.ts");
    assert.match(src, /\.eq\("created_by", user\.id\)/);
  });

  it("GET patient studies verifies patient ownership before listing", () => {
    const src = readApiRoute("app/api/patients/[patientId]/studies/route.ts");
    assert.match(src, /\.eq\("created_by", user\.id\)/);
    assert.match(src, /\.eq\("patient_id", patientId\)/);
  });
});
