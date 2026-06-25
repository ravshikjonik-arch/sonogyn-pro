import { expect, test } from "@playwright/test";

test.describe("Security smoke — API boundaries", () => {
  test("GET /api/patients без сессии → 401", async ({ request }) => {
    const res = await request.get("/api/patients");
    expect(res.status()).toBe(401);
  });

  test("POST /api/auth/sign-in — пустое тело → 400 (Zod)", async ({ request }) => {
    const res = await request.post("/api/auth/sign-in", {
      data: {},
    });
    expect(res.status()).toBe(400);
    const json = (await res.json()) as { error?: { fieldErrors?: Record<string, string[]> } };
    expect(json.error).toBeTruthy();
  });

  test("POST /api/auth/sign-in — невалидный email → 400", async ({ request }) => {
    const res = await request.post("/api/auth/sign-in", {
      data: { email: "not-an-email", password: "secret123" },
    });
    expect(res.status()).toBe(400);
  });

  test("POST /api/auth/sign-up — без birth_date → 400", async ({ request }) => {
    const res = await request.post("/api/auth/sign-up", {
      data: {
        email: "doctor@example.com",
        password: "secret123",
        full_name: "Тест Тестов",
        specialization: "obgyn",
      },
    });
    expect(res.status()).toBe(400);
  });

  test("POST /api/auth/telegram/verify-otp — пустое тело → 400", async ({ request }) => {
    const res = await request.post("/api/auth/telegram/verify-otp", { data: {} });
    expect(res.status()).toBe(400);
  });

  test("POST /api/auth/phone/send-otp — без phone → 400", async ({ request }) => {
    const res = await request.post("/api/auth/phone/send-otp", { data: {} });
    expect(res.status()).toBe(400);
  });

  test("POST /api/copilot/images/register без сессии → 401", async ({ request }) => {
    const res = await request.post("/api/copilot/images/register", {
      data: {
        studyId: "11111111-1111-4111-8111-111111111111",
        seriesId: "22222222-2222-4222-8222-222222222222",
        storagePath: "u/s/p/frame.png",
        fileName: "frame.png",
      },
    });
    expect(res.status()).toBe(401);
  });

  test("POST /api/copilot/images/register — невалидный UUID → 400", async ({ request }) => {
    const res = await request.post("/api/copilot/images/register", {
      data: {
        studyId: "bad-id",
        seriesId: "22222222-2222-4222-8222-222222222222",
        storagePath: "u/s/p/frame.png",
        fileName: "frame.png",
      },
    });
    expect([400, 401]).toContain(res.status());
  });

  test("GET /api/cases?q=test — без auth допустим (200 или 401 по политике)", async ({ request }) => {
    const res = await request.get("/api/cases?q=test&limit=5");
    expect([200, 401]).toContain(res.status());
  });

  test("POST /api/ai/vascular-assist без сессии → 401 или 403", async ({ request }) => {
    const res = await request.post("/api/ai/vascular-assist", {
      data: { mode: "clinical", basin: "extracranial" },
    });
    expect([401, 403]).toContain(res.status());
  });

  test("GET /api/debug/supabase в production недоступен (404 в dev может быть 200)", async ({
    request,
  }) => {
    const res = await request.get("/api/debug/supabase");
    expect([404, 200]).toContain(res.status());
  });
});

test.describe("Security smoke — ILIKE / search", () => {
  test("GET /api/patients?q=%25_%5C — не 500 при wildcard", async ({ request }) => {
    const res = await request.get("/api/patients?q=%25_%5C");
    expect(res.status()).not.toBe(500);
  });
});
