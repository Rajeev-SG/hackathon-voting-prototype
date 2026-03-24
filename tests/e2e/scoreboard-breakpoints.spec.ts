import { expect, test } from "playwright/test";

const runLayoutProof = process.env.LAYOUT_PROOF === "1";
const viewports = [
  { name: "mobile-tight", width: 480, height: 900, colorScheme: "dark" as const },
  { name: "mid-width", width: 560, height: 900, colorScheme: "dark" as const },
  { name: "tablet", width: 768, height: 1024, colorScheme: "light" as const },
  { name: "wide-desktop", width: 1575, height: 1100, colorScheme: "light" as const }
];

test.describe("scoreboard progress rail stays coherent across breakpoints", () => {
  test.skip(!runLayoutProof, "Run this focused breakpoint proof only when explicitly requested.");

  for (const viewport of viewports) {
    test(`${viewport.name} keeps the progress cards contained`, async ({ page }, testInfo) => {
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

      await expect(page.getByTestId("workflow-summary")).toBeVisible();

      const pageMetrics = await page.evaluate(() => ({
        viewportWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth
      }));

      expect(pageMetrics.scrollWidth).toBe(pageMetrics.viewportWidth);

      const summaryTop = await page.locator("[data-testid='workflow-summary']").evaluate((element) => {
        return element.getBoundingClientRect().top;
      });
      const scoreboardTop = await page.locator("[data-testid='scoreboard-section']").evaluate((element) => {
        return element.getBoundingClientRect().top;
      });

      expect(summaryTop).toBeGreaterThanOrEqual(0);
      expect(scoreboardTop).toBeLessThan(viewport.height * 0.82);

      const stateMetrics = await page.locator("[data-testid='progress-stat-state']").evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const value = element.querySelector<HTMLElement>("[data-testid='progress-stat-state-value']");
        const valueRect = value?.getBoundingClientRect();

        return {
          cardLeft: rect.left,
          cardRight: rect.right,
          viewportWidth: window.innerWidth,
          valueText: value?.textContent?.trim() ?? "",
          valueTopInset: valueRect ? valueRect.top - rect.top : null,
          valueBottomInset: valueRect ? rect.bottom - valueRect.bottom : null
        };
      });

      expect(stateMetrics.cardLeft).toBeGreaterThanOrEqual(0);
      expect(stateMetrics.cardRight).toBeLessThanOrEqual(stateMetrics.viewportWidth);
      expect(stateMetrics.valueText.length).toBeGreaterThan(0);
      expect(stateMetrics.valueTopInset).not.toBeNull();
      expect(stateMetrics.valueBottomInset).not.toBeNull();
      expect(stateMetrics.valueTopInset!).toBeGreaterThan(10);
      expect(stateMetrics.valueBottomInset!).toBeGreaterThan(10);

      await page.screenshot({ path: testInfo.outputPath(`${viewport.name}.png`), fullPage: true });
      expect(serverErrors.filter((entry) => entry.includes(appOrigin))).toEqual([]);
    });
  }
});
