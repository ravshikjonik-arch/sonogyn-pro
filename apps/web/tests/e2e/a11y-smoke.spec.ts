import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * Soft a11y smoke: always asserts page loads.
 * Critical/serious failures only when A11Y_STRICT=true.
 */
const STRICT = process.env.A11Y_STRICT === "true";

const ROUTES = [
  { path: "/landing", name: "landing" },
  { path: "/login", name: "login" },
] as const;

test.describe("A11y smoke (axe)", () => {
  for (const route of ROUTES) {
    test(`${route.name} — axe scan`, async ({ page }, testInfo) => {
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await expect(page.locator("body")).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const critical = results.violations.filter((v) => v.impact === "critical");
      const serious = results.violations.filter((v) => v.impact === "serious");

      const outDir = path.join(testInfo.project.outputDir, "a11y");
      fs.mkdirSync(outDir, { recursive: true });
      const reportPath = path.join(outDir, `${route.name}.json`);
      fs.writeFileSync(
        reportPath,
        JSON.stringify(
          {
            route: route.path,
            url: page.url(),
            counts: {
              total: results.violations.length,
              critical: critical.length,
              serious: serious.length,
            },
            violations: results.violations.map((v) => ({
              id: v.id,
              impact: v.impact,
              description: v.description,
              helpUrl: v.helpUrl,
              nodes: v.nodes.length,
            })),
          },
          null,
          2,
        ),
        "utf8",
      );
      await testInfo.attach(`a11y-${route.name}`, {
        path: reportPath,
        contentType: "application/json",
      });

      testInfo.annotations.push({
        type: "a11y",
        description: `${route.path}: ${critical.length} critical, ${serious.length} serious, ${results.violations.length} total`,
      });

      if (STRICT) {
        expect(critical, `critical a11y on ${route.path}`).toEqual([]);
        expect(serious, `serious a11y on ${route.path}`).toEqual([]);
      }
    });
  }
});
