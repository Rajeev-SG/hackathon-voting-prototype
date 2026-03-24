import { expect, test } from "playwright/test";

const runLayoutProof = process.env.LAYOUT_PROOF === "1";
const viewports = [
  { name: "mobile-tight", width: 480, height: 900, colorScheme: "dark" as const },
  { name: "mid-width", width: 560, height: 900, colorScheme: "dark" as const },
  { name: "tablet", width: 768, height: 1024, colorScheme: "light" as const },
  { name: "wide-desktop", width: 1575, height: 1100, colorScheme: "light" as const }
];

test.describe("single-column scoreboard stays coherent across breakpoints", () => {
  test.skip(!runLayoutProof, "Run this focused breakpoint proof only when explicitly requested.");

  for (const viewport of viewports) {
    test(`${viewport.name} keeps the scoreboard flow coherent`, async ({ page }, testInfo) => {
      if (testInfo.project.name === "desktop-light" && viewport.name === "mobile-tight") {
        test.skip(true, "Mobile-tight layout is covered by the dedicated mobile project.");
      }

      if (testInfo.project.name === "mobile-dark" && viewport.name === "wide-desktop") {
        test.skip(true, "Wide-desktop layout is covered by the desktop project.");
      }

      const serverErrors: string[] = [];
      page.on("response", (response) => {
        if (response.status() < 500) return;
        serverErrors.push(`${response.status()} ${response.url()}`);
      });

      await page.emulateMedia({ colorScheme: viewport.colorScheme });
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/");
      const appOrigin = new URL(page.url()).origin;

      await expect(page.getByTestId("scoreboard-section")).toBeVisible();
      await expect(page.getByTestId("competition-state-badge")).toBeVisible();
      await expect(page.getByTestId("progress-panel")).toHaveCount(0);
      await expect(page.getByTestId("workflow-summary")).toHaveCount(0);

      const pageMetrics = await page.evaluate(() => ({
        viewportWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth
      }));

      expect(pageMetrics.scrollWidth).toBe(pageMetrics.viewportWidth);

      const scoreboardTop = await page.locator("[data-testid='scoreboard-section']").evaluate((element) => {
        return element.getBoundingClientRect().top;
      });

      expect(scoreboardTop).toBeLessThan(viewport.height * 0.82);

      const stateBadgeMetrics = await page.locator("[data-testid='competition-state-badge']").evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          viewportWidth: window.innerWidth,
          text: element.textContent?.trim() ?? ""
        };
      });

      expect(stateBadgeMetrics.left).toBeGreaterThanOrEqual(0);
      expect(stateBadgeMetrics.right).toBeLessThanOrEqual(stateBadgeMetrics.viewportWidth);
      expect(stateBadgeMetrics.text.length).toBeGreaterThan(0);

      await page.screenshot({ path: testInfo.outputPath(`${viewport.name}.png`), fullPage: true });
      expect(serverErrors.filter((entry) => entry.includes(appOrigin))).toEqual([]);
    });
  }
});
