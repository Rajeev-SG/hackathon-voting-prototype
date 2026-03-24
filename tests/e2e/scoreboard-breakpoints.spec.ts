import { expect, test } from "playwright/test";

const viewports = [
  { name: "mobile-tight", width: 480, height: 900, colorScheme: "dark" as const },
  { name: "mid-width", width: 560, height: 900, colorScheme: "dark" as const },
  { name: "tablet", width: 768, height: 1024, colorScheme: "light" as const },
  { name: "wide-desktop", width: 1575, height: 1100, colorScheme: "light" as const }
];

test.describe("scoreboard progress rail stays coherent across breakpoints", () => {
  for (const viewport of viewports) {
    test(`${viewport.name} keeps the progress cards contained`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: viewport.colorScheme });
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/");

      await expect(page.getByRole("heading", { name: "Hackathon scoreboard" })).toBeVisible();

      const pageMetrics = await page.evaluate(() => ({
        viewportWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth
      }));

      expect(pageMetrics.scrollWidth).toBe(pageMetrics.viewportWidth);

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
    });
  }
});
