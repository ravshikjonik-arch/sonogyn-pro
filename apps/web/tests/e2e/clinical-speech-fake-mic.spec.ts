import { expect, test } from "@playwright/test";

const ROUTE = "/ai/consultants/gynecology";

test.describe("Clinical speech — fake Web Speech (opt-in)", () => {
  test.skip(process.env.PLAYWRIGHT_FAKE_MIC !== "1", "Set PLAYWRIGHT_FAKE_MIC=1 to run");

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      class FakeSpeechRecognition {
        lang = "ru-RU";
        continuous = false;
        interimResults = false;
        maxAlternatives = 1;
        onresult: ((event: SpeechRecognitionEvent) => void) | null = null;
        onerror: ((event: Event) => void) | null = null;
        onend: (() => void) | null = null;

        start() {
          window.setTimeout(() => {
            const alternative = { transcript: "киста сорок миллиметров", confidence: 0.9 };
            const result = {
              isFinal: true,
              length: 1,
              0: alternative,
              item: (i: number) => (i === 0 ? alternative : null),
            };
            const results = {
              length: 1,
              0: result,
              item: (i: number) => (i === 0 ? result : null),
            };
            const event = {
              resultIndex: 0,
              results,
            } as SpeechRecognitionEvent;
            this.onresult?.(event);
            this.onend?.();
          }, 80);
        }

        stop() {
          this.onend?.();
        }

        abort() {
          this.onend?.();
        }
      }

      window.SpeechRecognition = FakeSpeechRecognition as unknown as typeof SpeechRecognition;
      window.webkitSpeechRecognition = window.SpeechRecognition;
    });

    await page.route("**/api/ai/speech/transcribe", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ available: false }),
        });
      } else {
        await route.fulfill({ status: 503, body: "{}" });
      }
    });
  });

  test("device STT appends transcript via fake recognition", async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });
    const dictation = page.locator('[data-e2e="dictation-field"]').first();
    await expect(dictation).toBeVisible({ timeout: 45_000 });
    await dictation.getByRole("button", { name: /Диктовка/i }).click();
    await expect(dictation.getByRole("textbox")).toHaveValue(/киста/i, { timeout: 20_000 });
  });
});
