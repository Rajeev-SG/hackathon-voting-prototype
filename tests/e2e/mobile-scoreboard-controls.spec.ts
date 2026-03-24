import { execFileSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

import { PrismaClient } from "@prisma/client";
import { devices, expect, test, type Page } from "playwright/test";

const prisma = new PrismaClient();

const MANAGER_EMAIL = "rajeev.gill@omc.com";
const REPO_ROOT = process.cwd();
const APP_URL = process.env.E2E_BASE_URL ?? "http://localhost:3017";

function runNodeScript(scriptPath: string, args: string[], extraEnv?: Record<string, string>) {
  return execFileSync("node", [scriptPath, ...args], {
    cwd: REPO_ROOT,
    env: {
      ...process.env,
      ...extraEnv
    },
    encoding: "utf8"
  })
    .trim()
    .split("\n")
    .at(-1)!
    .trim();
}

function createSignInTicket(baseURL: string, email: string) {
  return runNodeScript(
    path.join(REPO_ROOT, "scripts/create-clerk-sign-in-token.mjs"),
    ["--email", email, "--redirect", "/"],
    {
      APP_URL: baseURL
    }
  );
}

function createProofWorkbook(outputPath: string) {
  return runNodeScript(path.join(REPO_ROOT, "scripts/generate-proof-workbook.mjs"), [outputPath]);
}

async function resetCompetitionState() {
  await prisma.vote.deleteMany();
  await prisma.entryTeamEmail.deleteMany();
  await prisma.entry.deleteMany();
  await prisma.competitionState.upsert({
    where: { id: 1 },
    update: {
      votingStatus: "PREPARING",
      startedAt: null,
      finalizedAt: null,
      managerEmail: MANAGER_EMAIL
    },
    create: {
      id: 1,
      votingStatus: "PREPARING",
      startedAt: null,
      finalizedAt: null,
      managerEmail: MANAGER_EMAIL
    }
  });
}

async function seedCompetitionEntries() {
  await prisma.entry.create({
    data: {
      slug: "aurora-atlas",
      projectName: "Aurora Atlas",
      teamName: "Team North Star",
      summary: "Turns hackathon judging notes into a navigable research map.",
      isVotingOpen: true,
      teamEmails: {
        create: [{ email: "aurora@example.com" }]
      }
    }
  });

  await prisma.entry.create({
    data: {
      slug: "signal-bloom",
      projectName: "Signal Bloom",
      teamName: "Team Ripple",
      summary: "Visualises community feedback as a live collaboration signal.",
      isVotingOpen: true,
      teamEmails: {
        create: [{ email: "signal@example.com" }]
      }
    }
  });

  await prisma.entry.create({
    data: {
      slug: "harbor-pulse",
      projectName: "Harbor Pulse",
      teamName: "Harbor Collective",
      summary: "Predicts footfall surges for event operations and booth staffing.",
      isVotingOpen: true,
      teamEmails: {
        create: [{ email: "harbor@example.com" }]
      }
    }
  });
}

async function uploadWorkbook(page: Page, workbookPath: string) {
  const [fileChooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByTestId("manager-upload-dropzone").click()
  ]);
  await fileChooser.setFiles(workbookPath);
  await expect(page.getByText("Imported 3 projects.")).toBeVisible();
}

async function expectMobileSummaryFlow(page: Page) {
  await expect(page.getByTestId("scoreboard-mobile-summary-panel")).toHaveCount(0);
  await page.getByTestId("scoreboard-mobile-summary-toggle").click();
  await expect(page.getByTestId("scoreboard-mobile-summary-panel")).toBeVisible();
  await page.getByTestId("scoreboard-mobile-summary-panel").getByRole("button", { name: "Close" }).click();
  await expect(page.getByTestId("scoreboard-mobile-summary-panel")).toHaveCount(0);
}

async function expectMobileViewFlow(page: Page) {
  await expect(page.getByTestId("scoreboard-mobile-view-panel")).toHaveCount(0);
  await page.getByTestId("scoreboard-mobile-view-toggle").click();
  await expect(page.getByTestId("scoreboard-mobile-view-panel")).toBeVisible();
  await page.getByTestId("scoreboard-mobile-view-panel").getByTestId("scoreboard-view-chart").click();
  await expect(page.getByTestId("scoreboard-chart-view")).toBeVisible();
  await page.getByTestId("scoreboard-mobile-view-toggle").click();
  await page.getByTestId("scoreboard-mobile-view-panel").getByTestId("scoreboard-view-table").click();
  await expect(page.getByTestId("scoreboard-chart-view")).toHaveCount(0);
  await expect(page.getByTestId("scoreboard-row-aurora-atlas").first()).toBeVisible();
}

test.describe("mobile scoreboard controls", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "This audit only targets the chromium mobile project.");
  test.skip(({ isMobile }) => !isMobile, "This audit only runs on the mobile project.");

  test.beforeEach(async () => {
    if (APP_URL.includes("localhost")) {
      await resetCompetitionState();
      await seedCompetitionEntries();
    }
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("manager and public users can use the mobile details and board-view overlays", async ({ page, browser }, testInfo) => {
    const workbookPath = testInfo.outputPath("mobile-controls-workbook.xlsx");
    createProofWorkbook(workbookPath);

    if (APP_URL.includes("localhost")) {
      await page.goto(APP_URL);
      await expect(page.getByTestId("manager-controls")).toHaveCount(0);
      await expect(page.getByTestId("scoreboard-row-aurora-atlas").first()).toBeVisible();
      await expectMobileSummaryFlow(page);
      await expectMobileViewFlow(page);
      await page.screenshot({ path: testInfo.outputPath("public-mobile-controls-local.png"), fullPage: true });
      return;
    }

    const managerTicket = createSignInTicket(APP_URL, MANAGER_EMAIL);
    await page.goto(managerTicket);
    await page.waitForURL((url) => url.origin + url.pathname === new URL(APP_URL).origin + "/");

    const resetButton = page.getByTestId("manager-reset-round");
    if (await resetButton.isVisible().catch(() => false)) {
      page.once("dialog", (dialog) => dialog.accept());
      await resetButton.click();
      await expect(page.getByText("Competition reset. Upload a fresh workbook to start the next dry run.")).toBeVisible();
    }

    await uploadWorkbook(page, workbookPath);
    await expect(page.getByTestId("scoreboard-row-aurora-atlas").first()).toBeVisible();

    await expectMobileSummaryFlow(page);
    await expectMobileViewFlow(page);
    await page.screenshot({ path: testInfo.outputPath("manager-mobile-controls.png"), fullPage: true });

    const publicContext = await browser.newContext({
      ...devices["Pixel 7"],
      colorScheme: "dark",
      storageState: { cookies: [], origins: [] }
    });
    const publicPage = await publicContext.newPage();
    await publicPage.goto(APP_URL);
    await expect(publicPage.getByTestId("manager-controls")).toHaveCount(0);
    await expect(publicPage.getByTestId("scoreboard-row-aurora-atlas").first()).toBeVisible();

    await expectMobileSummaryFlow(publicPage);
    await expectMobileViewFlow(publicPage);
    await publicPage.screenshot({ path: testInfo.outputPath("public-mobile-controls.png"), fullPage: true });

    await publicContext.close();
  });
});
