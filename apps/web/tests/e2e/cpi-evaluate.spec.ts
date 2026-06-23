import { expect, test } from "@playwright/test";

/** Minimal valid CPI case — mirrors modules/cervical-pathology tests. */
const CPI_EVALUATE_BODY = {
  colposcopy: {
    adequacyId: "adequacy_satisfactory",
    scjVisibilityId: "scj_completely_visible",
    transformationZoneTypeId: "tz2",
    findingSignIds: ["dense_acetowhite"],
  },
  hpv: {
    status: "positive",
    genotypes: ["hpv16"],
    viralLoad: "not_available",
    persistent: false,
  },
  cytology: { result: "hsil" },
  histology: { result: "none" },
  clinical: {
    age: 34,
    pregnancy: false,
    immunosuppression: false,
    smoking: false,
    priorCinTreatment: "none",
    glandularSuspicion: "none",
    suspectedGlandularLesion: false,
  },
};

test.describe("CPI API smoke", () => {
  test("POST /api/cpi/evaluate returns risk + CDS", async ({ request }) => {
    const res = await request.post("/api/cpi/evaluate", {
      data: CPI_EVALUATE_BODY,
    });

    expect(res.status()).toBe(200);
    const json = (await res.json()) as {
      evaluation: {
        schema: string;
        risk: { cin2PlusRisk: number };
        actions: unknown[];
        disclaimer: string;
      };
    };

    expect(json.evaluation.schema).toBe("cpi.evaluation.v1");
    expect(json.evaluation.risk.cin2PlusRisk).toBeGreaterThan(0);
    expect(json.evaluation.actions.length).toBeGreaterThan(0);
    expect(json.evaluation.disclaimer).toMatch(/clinical judgment/i);
  });

  test("POST /api/cpi/evaluate rejects invalid payload", async ({ request }) => {
    const res = await request.post("/api/cpi/evaluate", {
      data: { colposcopy: {} },
    });
    expect(res.status()).toBe(400);
  });
});

test.describe("CPI Dashboard deep link", () => {
  test("calculator route accepts patientId query param", async ({ request }) => {
    const res = await request.get(
      "/calculators/cervical-intelligence?patientId=22222222-2222-4222-8222-222222222222&studyId=33333333-3333-4333-8333-333333333333",
    );
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toMatch(/Cervical Pathology Intelligence/i);
  });
});
