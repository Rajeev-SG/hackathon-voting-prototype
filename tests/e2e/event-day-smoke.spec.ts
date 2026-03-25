import { execFileSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

import { expect, test, type Browser, type Page } from "playwright/test";

import { createDirectPrismaClient } from "@/tests/e2e/support/direct-prisma";

const prisma = createDirectPrismaClient();

const MANAGER_EMAIL = "rajeev.gill@omc.com";
const JUDGE_EMAIL = "judge.one+clerk_test@example.com";
const REPO_ROOT = process.cwd();

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

function createDesktopContext(browser: Browser) {
  return browser.newContext({
    viewport: { width: 1440, height: 1100 },
    colorScheme: "light",
    acceptDownloads: true
  });
}

async function signInWithTicket(page: Page, baseURL: string, email: string) {
  const ticketUrl = createSignInTicket(baseURL, email);
  await page.goto(ticketUrl);
  await page.waitForURL((url) => url.origin + url.pathname === new URL(baseURL).origin + "/");
}

async function uploadWorkbook(page: Page, workbookPath: string) {
  const [fileChooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByTestId("manager-upload-dropzone").click()
  ]);
  await fileChooser.setFiles(workbookPath);
  await expect(page.getByText("Imported 3 projects.")).toBeVisible();
}

async function ensureManagerCleanStart(page: Page, baseURL: string) {
  await signInWithTicket(page, baseURL, MANAGER_EMAIL);
  await page.goto("/");

  const stateBadge = page.locator('[data-testid="competition-state-badge"]:visible').first();
  const stateText = (await stateBadge.textContent())?.trim();
  const hasEntries = (await page.getByTestId(/^scoreboard-row-/).count()) > 0;

  if (stateText === "Preparing" && !hasEntries) {
    return;
  }

  const resetButton = page.getByTestId("manager-reset-round");
  await expect(resetButton).toBeVisible();
  page.once("dialog", (dialog) => void dialog.accept());
  await resetButton.click();
  await expect(page.getByText("Competition reset. Upload a fresh workbook to start the next dry run.")).toBeVisible();
  await expect(page.getByTestId("scoreboard-empty-heading")).toBeVisible();
}

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("event-day smoke: manager can recover to a clean round and a judge/public path still works", async ({
  baseURL,
  browser
}, testInfo) => {
  testInfo.setTimeout(180000);
  const workbookPath = testInfo.outputPath("event-day-smoke-workbook.xlsx");
  createProofWorkbook(workbookPath);

  if (baseURL?.includes("localhost") || baseURL?.includes("127.0.0.1")) {
    await resetCompetitionState();
  }

  const managerContext = await createDesktopContext(browser);
  const managerPage = await managerContext.newPage();
  const judgeContext = await createDesktopContext(browser);
  const judgePage = await judgeContext.newPage();
  const publicContext = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    colorScheme: "light",
    storageState: { cookies: [], origins: [] }
  });
  const publicPage = await publicContext.newPage();

  await ensureManagerCleanStart(managerPage, baseURL!);

  await publicPage.goto("/");
  await expect(publicPage.getByTestId("scoreboard-empty-heading")).toBeVisible();

  await uploadWorkbook(managerPage, workbookPath);
  await managerPage.getByTestId("manager-begin-voting").click();
  await expect(managerPage.locator('[data-testid="competition-state-badge"]:visible').first()).toHaveText("Voting live");

  await signInWithTicket(judgePage, baseURL!, JUDGE_EMAIL);
  await judgePage.getByTestId("scoreboard-action-aurora-atlas").first().click();
  await judgePage.getByTestId("score-option-7").click();
  await judgePage.getByTestId("submit-vote").click();
  await expect(judgePage.getByText("Judge", { exact: true })).toBeVisible();
  await expect(judgePage.getByTestId("scoreboard-action-aurora-atlas").first()).toContainText("Scored");

  await managerPage.goto("/");
  await expect(managerPage.getByTestId("manager-remaining-votes")).toContainText("Judge");

  await publicPage.goto("/");
  await expect(publicPage.getByTestId("scoreboard-row-aurora-atlas").first()).toContainText("1 vote", {
    timeout: 12000
  });

  await publicPage.screenshot({ path: testInfo.outputPath("event-day-smoke-public.png"), fullPage: true });

  await Promise.all([managerContext.close(), judgeContext.close(), publicContext.close()]);
});
