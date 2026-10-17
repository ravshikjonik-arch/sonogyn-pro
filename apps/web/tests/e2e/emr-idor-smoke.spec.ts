import { expect, test } from "@playwright/test";

import testData from "./fixtures/test-data.json";

const DOCTOR_PATIENT_ID = "11111111-1111-4111-8111-111111111111";
const ADMIN_PATIENT_ID = "22222222-2222-4222-8222-222222222222";

async function signIn(
  request: Parameters<Parameters<typeof test>[1]>[0]["request"],
  email: string,
  password: string,
) {
  const res = await request.post("/api/auth/sign-in", {
    data: { email, password },
  });
  expect(res.ok()).toBeTruthy();
}

/**
 * CI stub only (E2E_FIXTURES + example.supabase.co).
 * Production/staging IDOR — scripts/staging-emr-idor-smoke.mjs
 */
test.describe("EMR IDOR smoke (CI stub)", () => {
  test("admin cannot read doctor-owned patient", async ({ request }) => {
    await signIn(request, testData.admin.email, testData.admin.password);
    const res = await request.get(`/api/patients/${DOCTOR_PATIENT_ID}`);
    expect(res.status()).toBe(404);
  });

  test("doctor can read own stub patient", async ({ request }) => {
    await signIn(request, testData.doctor.email, testData.doctor.password);
    const res = await request.get(`/api/patients/${DOCTOR_PATIENT_ID}`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { patient?: { id?: string } };
    expect(body.patient?.id).toBe(DOCTOR_PATIENT_ID);
  });

  test("doctor cannot read admin-owned patient", async ({ request }) => {
    await signIn(request, testData.doctor.email, testData.doctor.password);
    const res = await request.get(`/api/patients/${ADMIN_PATIENT_ID}`);
    expect(res.status()).toBe(404);
  });

  test("patient studies list respects owner (stub)", async ({ request }) => {
    await signIn(request, testData.admin.email, testData.admin.password);
    const res = await request.get(`/api/patients/${DOCTOR_PATIENT_ID}/studies`);
    expect(res.status()).toBe(404);
  });
});
