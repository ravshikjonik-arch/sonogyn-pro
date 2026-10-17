import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getE2eEmrPatientForUser,
  listE2eEmrPatientsForUser,
} from "../emr-patient-fixtures";

describe("e2e EMR patient fixtures", () => {
  it("lists only rows for owner", () => {
    const doctorRows = listE2eEmrPatientsForUser("e2e-user-id");
    assert.equal(doctorRows.length, 1);
    assert.equal(doctorRows[0]?.created_by, "e2e-user-id");
  });

  it("returns null for cross-user patient id", () => {
    const hit = getE2eEmrPatientForUser(
      "11111111-1111-4111-8111-111111111111",
      "e2e-admin-id",
    );
    assert.equal(hit, null);
  });
});
