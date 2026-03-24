import { expect, test } from "playwright/test";

test("consent-enabled analytics emits dataLayer events and server-routed collection traffic", async ({
  page
}, testInfo) => {
  const collectRequests: string[] = [];
  const gtagLoads: string[] = [];

  await page.addInitScript(() => {
    window.localStorage.removeItem("hackathon-voting:analytics-consent");
    document.documentElement.dataset.analyticsConsent = "unknown";
  });

  page.on("request", (request) => {
    const url = request.url();

    if (url.includes("/metrics/g/collect")) {
      collectRequests.push(url);
    }

    if (url.includes("googletagmanager.com/gtag/js")) {
      gtagLoads.push(url);
    }
  });

  await page.goto("/");
  await expect(page.getByText("Analytics preferences")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("analytics-before-consent.png"), fullPage: true });

  await page.getByRole("button", { name: "Allow analytics" }).click();
  await expect(page.getByText("Analytics preferences")).not.toBeVisible();

  await page.getByTestId("judge-auth-open").click();
  await expect(page.getByRole("dialog", { name: "Judge access" })).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();

  await page.screenshot({ path: testInfo.outputPath("analytics-after-consent.png"), fullPage: true });

  await page.waitForTimeout(3000);

  const consentState = await page.evaluate(() => {
    return {
      dataset: document.documentElement.dataset.analyticsConsent,
      events: (window.dataLayer ?? [])
        .map((entry) => {
          const candidate = entry as { event?: string };
          return typeof candidate.event === "string" ? candidate.event : null;
        })
        .filter(Boolean)
    };
  });

  expect(gtagLoads.length).toBeGreaterThan(0);
  expect(collectRequests.length).toBeGreaterThan(0);
  expect(consentState.dataset).toBe("granted");
  expect(consentState.events).toContain("page_context");
  expect(consentState.events).toContain("consent_state_updated");
  expect(consentState.events).toContain("judge_auth_dialog_opened");
});
