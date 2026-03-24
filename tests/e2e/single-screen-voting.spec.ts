import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { PrismaClient } from "@prisma/client";
import { expect, test, type Browser, type Page, devices } from "playwright/test";
import * as XLSX from "xlsx";

import { TEMPLATE_SHEET_NAME } from "@/lib/constants";

const prisma = new PrismaClient();

const MANAGER_EMAIL = "rajeev.gill@omc.com";
const JUDGE_EMAIL = "judge.one+clerk_test@example.com";
const SELF_BLOCKED_EMAIL = "judge.self+clerk_test@example.com";
const REPO_ROOT = process.cwd();
const JUDGE_AUTH_MODE = process.env.E2E_JUDGE_AUTH_MODE ?? "email-code";

function slugifyProjectName(projectName: string) {
  return projectName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function activeResponsiveIndex(projectName: string) {
  return projectName.includes("mobile") ? 0 : 1;
}

function createRoleContext(browser: Browser, projectName: string) {
  if (projectName.includes("mobile")) {
    return browser.newContext({
      ...devices["Pixel 7"],
      colorScheme: "dark",
      acceptDownloads: true
    });
  }

  return browser.newContext({
    viewport: { width: 1440, height: 1100 },
    colorScheme: "light",
    acceptDownloads: true
  });
}

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

async function ensureProofUsers(baseURL: string) {
  for (const email of [MANAGER_EMAIL, JUDGE_EMAIL, SELF_BLOCKED_EMAIL]) {
    runNodeScript(
      path.join(REPO_ROOT, "scripts/create-clerk-sign-in-token.mjs"),
      ["--email", email, "--redirect", "/"],
      {
        APP_URL: baseURL
      }
    );
  }
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

function createDroppedWorkbookVariant(sourcePath: string, outputPath: string) {
  const workbook = XLSX.readFile(sourcePath);
  const sheet = workbook.Sheets[TEMPLATE_SHEET_NAME];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });

  const updatedRows = rows.map((row) =>
    row["Project Name"] === "Harbor Pulse"
      ? {
          ...row,
          "Team Name": "Harbor Collective Reloaded"
        }
      : row
  );

  workbook.Sheets[TEMPLATE_SHEET_NAME] = XLSX.utils.json_to_sheet(updatedRows);
  XLSX.writeFile(workbook, outputPath);
}

async function dropWorkbook(page: Page, filePath: string) {
  const dataTransfer = await page.evaluateHandle(
    async ({ name, mimeType, base64 }) => {
      const dataTransfer = new DataTransfer();
      const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
      dataTransfer.items.add(new File([bytes], name, { type: mimeType }));
      return dataTransfer;
    },
    {
      name: path.basename(filePath),
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      base64: fs.readFileSync(filePath).toString("base64")
    }
  );

  const dropzone = page.getByTestId("manager-upload-dropzone");
  await dropzone.dispatchEvent("dragenter", { dataTransfer });
  await dropzone.dispatchEvent("dragover", { dataTransfer });
  await dropzone.dispatchEvent("drop", { dataTransfer });
}

async function signInWithTicket(page: Page, baseURL: string, email: string, expectedRoleLabel: string) {
  const ticketUrl = createSignInTicket(baseURL, email);
  await page.goto(ticketUrl);
  await page.waitForURL((url) => url.origin + url.pathname === new URL(baseURL).origin + "/");
  await expect(page.getByText(expectedRoleLabel, { exact: true })).toBeVisible();
}

async function signInJudgeWithEmailCode(page: Page, email: string) {
  await page.goto("/");
  await page.getByTestId("judge-auth-open").click();
  await expect(page.getByRole("dialog", { name: "Judge access" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email address" })).toBeFocused();
  await page.getByRole("textbox", { name: "Email address" }).fill(email);
  await page.getByTestId("send-email-code").click();
  await expect(page.getByRole("textbox", { name: "Verification code" })).toBeVisible();
  await expect(page.getByText(`Checking in as ${email}`)).toBeVisible();
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Verification code" })).toBeVisible();
  await expect(page.getByText(`Checking in as ${email}`)).toBeVisible();
  await page.getByRole("textbox", { name: "Verification code" }).fill("424242");
  await page.getByTestId("verify-email-code").click();
  await expect(page.getByText("Judge", { exact: true })).toBeVisible();
}

async function openVoteDialog(page: Page, projectName: string) {
  const slug = slugifyProjectName(projectName);
  const index = activeResponsiveIndex(test.info().project.name);
  await page.getByTestId(`scoreboard-action-${slug}`).nth(index).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  return dialog;
}

async function expectDialogToFitViewport(page: Page) {
  const dialog = page.getByRole("dialog");
  const submitButton = page.getByTestId("submit-vote");

  const measurements = await dialog.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top,
      bottom: rect.bottom,
      height: rect.height,
      viewportHeight: window.innerHeight
    };
  });

  expect(measurements.top).toBeGreaterThanOrEqual(0);
  expect(measurements.bottom).toBeLessThanOrEqual(measurements.viewportHeight);
  await expect(submitButton).toBeVisible();
}

async function saveVote(page: Page, score: number) {
  await page.getByTestId(`score-option-${score}`).click();
  await page.getByTestId("submit-vote").click();
  const dialog = page.getByRole("dialog");
  const savedToast = page.getByTestId("vote-saved-toast");

  try {
    await expect(dialog).not.toBeVisible({ timeout: 4000 });
    return;
  } catch {
    await expect(savedToast).toBeVisible({ timeout: 4000 });
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible({ timeout: 4000 });
  }
}

async function takeShot(page: Page, outputPath: string) {
  await page.screenshot({
    path: outputPath,
    fullPage: true
  });
}

async function expectCompetitionStateBadge(page: Page, expectedText: string) {
  const badge = page.getByTestId("competition-state-badge");
  await expect(badge).toBeVisible();
  await expect(badge).toHaveText(expectedText);
}

test.beforeEach(async ({ baseURL }, testInfo) => {
  await resetCompetitionState();
  await ensureProofUsers(baseURL!);
  testInfo.setTimeout(180000);
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("manager, judges, and public users complete the single-screen voting flow", async ({
  baseURL,
  browser
}, testInfo) => {
  const workbookPath = testInfo.outputPath("hackathon-proof-workbook.xlsx");
  const droppedWorkbookPath = testInfo.outputPath("hackathon-proof-workbook-drop.xlsx");
  createProofWorkbook(workbookPath);
  createDroppedWorkbookVariant(workbookPath, droppedWorkbookPath);

  const managerContext = await createRoleContext(browser, testInfo.project.name);
  const managerPage = await managerContext.newPage();
  const anonymousContext = await createRoleContext(browser, testInfo.project.name);
  const anonymousPage = await anonymousContext.newPage();
  const judgeContext = await createRoleContext(browser, testInfo.project.name);
  const judgePage = await judgeContext.newPage();
  const selfBlockedContext = await createRoleContext(browser, testInfo.project.name);
  const selfBlockedPage = await selfBlockedContext.newPage();

  await test.step("Anonymous visitors can see the board but not manager tools", async () => {
    await anonymousPage.goto("/");
    await expect(anonymousPage.getByRole("heading", { name: "Live hackathon scoreboard" })).toBeVisible();
    await expect(anonymousPage.getByTestId("scoreboard-empty-heading")).toBeVisible();
    await expectCompetitionStateBadge(anonymousPage, "Preparing");
    await expect(anonymousPage.getByText("Manager setup")).toHaveCount(0);
    await expect(anonymousPage.getByText("Manager controls")).toHaveCount(0);
    await expect(anonymousPage.getByTestId("manager-download-template")).toHaveCount(0);
    await expect(anonymousPage.getByTestId("manager-upload-dropzone")).toHaveCount(0);
    await takeShot(anonymousPage, testInfo.outputPath("public-before-setup.png"));
  });

  await test.step("Manager downloads the template, uploads the workbook, and begins voting", async () => {
    await signInWithTicket(managerPage, baseURL!, MANAGER_EMAIL, "Manager");

    const [templateDownload] = await Promise.all([
      managerPage.waitForEvent("download"),
      managerPage.getByTestId("manager-download-template").click()
    ]);
    expect(templateDownload.suggestedFilename()).toContain("hackathon-voting-template");

    const [dropzoneFileChooser] = await Promise.all([
      managerPage.waitForEvent("filechooser"),
      managerPage.getByTestId("manager-upload-dropzone").click()
    ]);
    await dropzoneFileChooser.setFiles(workbookPath);
    await expect(managerPage.getByText("Imported 3 projects.")).toBeVisible();
    const rowIndex = activeResponsiveIndex(testInfo.project.name);
    await expect(managerPage.getByTestId("scoreboard-row-aurora-atlas").nth(rowIndex)).toBeVisible();
    await expect(managerPage.getByTestId("scoreboard-row-signal-bloom").nth(rowIndex)).toBeVisible();
    await expect(managerPage.getByTestId("scoreboard-row-harbor-pulse").nth(rowIndex)).toBeVisible();

    await dropWorkbook(managerPage, droppedWorkbookPath);
    await expect(managerPage.getByText("Imported 3 projects.")).toBeVisible();
    await expect(managerPage.getByTestId("scoreboard-row-harbor-pulse").nth(rowIndex)).toContainText(
      "Harbor Collective Reloaded"
    );

    await managerPage.getByTestId("scoreboard-view-chart").click();
    await expect(managerPage.getByTestId("scoreboard-chart-view")).toBeVisible();
    await takeShot(managerPage, testInfo.outputPath("manager-chart-view.png"));
    await managerPage.getByTestId("scoreboard-view-table").click();
    if (testInfo.project.name.includes("mobile")) {
      await expect(managerPage.getByTestId("scoreboard-row-aurora-atlas").nth(rowIndex)).toBeVisible();
    } else {
      await expect(managerPage.getByTestId("scoreboard-table-view")).toBeVisible();
    }
    await takeShot(managerPage, testInfo.outputPath("manager-after-upload.png"));

    await managerPage.getByTestId("manager-begin-voting").click();
    await expectCompetitionStateBadge(managerPage, "Voting live");

    await managerPage
      .getByTestId("manager-entry-toggle-harbor-pulse")
      .nth(activeResponsiveIndex(testInfo.project.name))
      .click();
    await expect(managerPage.getByText("Harbor Pulse is now closed to new votes.")).toBeVisible();
    await expect(
      managerPage
        .getByTestId("scoreboard-action-harbor-pulse")
        .nth(activeResponsiveIndex(testInfo.project.name))
    ).toContainText("Closed");
  });

  await test.step("Anonymous users stay read-only after voting opens", async () => {
    await anonymousPage.goto("/");
    await openVoteDialog(anonymousPage, "Harbor Pulse");
    await expect(anonymousPage.getByText("Voting is paused for this project right now.")).toBeVisible();
    await expect(anonymousPage.getByTestId("submit-vote")).toHaveCount(0);
    await anonymousPage.getByRole("button", { name: "Close" }).click();

    await openVoteDialog(anonymousPage, "Aurora Atlas");
    await expect(anonymousPage.getByText("Sign in to cast your vote")).toBeVisible();
    await expect(anonymousPage.getByTestId("submit-vote")).toHaveCount(0);
    await anonymousPage.getByRole("button", { name: "Close" }).click();
  });

  await test.step("A judge signs in by email code and submits keyboard-friendly modal votes", async () => {
    if (JUDGE_AUTH_MODE === "ticket") {
      await signInWithTicket(judgePage, baseURL!, JUDGE_EMAIL, "Judge");
    } else {
      await signInJudgeWithEmailCode(judgePage, JUDGE_EMAIL);
    }

    await openVoteDialog(judgePage, "Harbor Pulse");
    await expect(judgePage.getByRole("heading", { name: "Voting is paused" })).toBeVisible();
    await judgePage.getByRole("button", { name: "Close" }).click();

    let voteDialog = await openVoteDialog(judgePage, "Aurora Atlas");
    await expectDialogToFitViewport(judgePage);
    await expect(voteDialog.getByTestId("score-option-7")).toBeFocused();
    await judgePage.keyboard.press("Space");
    await expect(voteDialog.getByTestId("score-option-7")).toHaveAttribute("data-state", "checked");
    await takeShot(judgePage, testInfo.outputPath("judge-modal-before-submit.png"));
    await judgePage.keyboard.press("Tab");
    await expect(voteDialog.getByTestId("submit-vote")).toBeFocused();
    await judgePage.keyboard.press("Enter");
    await expect(judgePage.getByText("Judge", { exact: true })).toBeVisible();
    await expect(
      judgePage
        .getByTestId("scoreboard-action-aurora-atlas")
        .nth(activeResponsiveIndex(testInfo.project.name))
    ).toContainText("Scored");
    await expect(
      judgePage
        .getByTestId("scoreboard-row-aurora-atlas")
        .nth(activeResponsiveIndex(testInfo.project.name))
    ).toContainText("1 vote");

    await managerPage.goto("/");
    await expect(managerPage.getByTestId("manager-remaining-votes")).toContainText("1 vote still outstanding.");
    await expect(managerPage.getByTestId("manager-remaining-votes")).toContainText(JUDGE_EMAIL);
    await expect(managerPage.getByTestId("manager-remaining-votes")).toContainText("Signal Bloom");

    await openVoteDialog(judgePage, "Signal Bloom");
    await saveVote(judgePage, 7);

    await openVoteDialog(judgePage, "Signal Bloom");
    await expect(judgePage.getByRole("heading", { name: "Score recorded" })).toBeVisible();
    await expect(
      judgePage.getByText("Each judge gets one vote per project in this round.")
    ).toBeVisible();
    await expect(judgePage.getByTestId("submit-vote")).toHaveCount(0);
    await takeShot(judgePage, testInfo.outputPath("judge-modal-locked-after-vote.png"));
    await judgePage.getByRole("button", { name: "Close" }).click();

    const signalBloomRow = judgePage.getByTestId("scoreboard-row-signal-bloom").nth(
      activeResponsiveIndex(testInfo.project.name)
    );
    const signalBloomAction = judgePage.getByTestId("scoreboard-action-signal-bloom").nth(
      activeResponsiveIndex(testInfo.project.name)
    );
    await expect(signalBloomRow).toContainText("1 vote");
    await expect(signalBloomRow).toContainText("7");
    await expect(signalBloomAction).toContainText("Scored");
    await expect(
      anonymousPage
        .getByTestId("scoreboard-row-signal-bloom")
        .nth(activeResponsiveIndex(testInfo.project.name))
    ).toContainText("7", { timeout: 12000 });

    await managerPage.goto("/");
    await managerPage
      .getByTestId("manager-entry-toggle-harbor-pulse")
      .nth(activeResponsiveIndex(testInfo.project.name))
      .click();
    await expect(managerPage.getByText("Harbor Pulse is now open for judging again.")).toBeVisible();

    await judgePage.goto("/");
    await openVoteDialog(judgePage, "Harbor Pulse");
    await saveVote(judgePage, 6);

    await takeShot(judgePage, testInfo.outputPath("judge-board-after-votes.png"));
  });

  await test.step("Self-voting is blocked automatically and gracefully", async () => {
    await signInWithTicket(selfBlockedPage, baseURL!, SELF_BLOCKED_EMAIL, "Judge");

    await openVoteDialog(selfBlockedPage, "Aurora Atlas");
    await expect(
      selfBlockedPage.getByText(
        "Self-voting is blocked automatically because your signed-in email matches a submitted team email for this project."
      )
    ).toBeVisible();
    await expect(selfBlockedPage.getByTestId("submit-vote")).toHaveCount(0);
    await selfBlockedPage.getByRole("button", { name: "Close" }).click();

    await openVoteDialog(selfBlockedPage, "Signal Bloom");
    await saveVote(selfBlockedPage, 5);

    await openVoteDialog(selfBlockedPage, "Harbor Pulse");
    await saveVote(selfBlockedPage, 4);
  });

  await test.step("Progress reaches completion and the manager finalizes the round", async () => {
    await managerPage.goto("/");
    await expect(managerPage.getByText("Everyone who joined the round is fully covered.")).toBeVisible();
    await expect(managerPage.getByTestId("manager-remaining-votes")).toContainText("Votes left");
    await expect(managerPage.getByTestId("manager-finalize")).toBeEnabled();

    const hasHorizontalOverflow = await managerPage.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    expect(hasHorizontalOverflow).toBe(false);

    await managerPage.getByTestId("manager-finalize").click();
    await expectCompetitionStateBadge(managerPage, "Finalized");

    const [exportDownload] = await Promise.all([
      managerPage.waitForEvent("download"),
      managerPage.getByTestId("manager-export-results").click()
    ]);
    expect(exportDownload.suggestedFilename()).toContain("finalized-scores");

    await takeShot(managerPage, testInfo.outputPath("manager-finalized.png"));
  });

  await test.step("Public users see the finalized board and locked modal state", async () => {
    await anonymousPage.goto("/");
    await expectCompetitionStateBadge(anonymousPage, "Finalized");
    await openVoteDialog(anonymousPage, "Signal Bloom");
    await expect(anonymousPage.getByRole("heading", { name: "Judging is finalized" })).toBeVisible();
    await expect(
      anonymousPage.getByText("Finalized results are locked now. Thanks for helping judge the field.")
    ).toBeVisible();

    const hasHorizontalOverflow = await anonymousPage.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    expect(hasHorizontalOverflow).toBe(false);

    await takeShot(anonymousPage, testInfo.outputPath("public-finalized.png"));
  });

  await test.step("Manager can reset the round and return to an empty workbook-driven state", async () => {
    await managerPage.goto("/");
    managerPage.once("dialog", (dialog) => void dialog.accept());
    await managerPage.getByTestId("manager-reset-round").click();
    await expect(managerPage.getByText("Competition reset. Upload a fresh workbook to start the next dry run.")).toBeVisible();
    await expect(managerPage.getByTestId("scoreboard-empty-heading")).toBeVisible();
    await expect(managerPage.getByTestId("manager-begin-voting")).toBeDisabled();
    await expect(managerPage.getByTestId("manager-upload-button")).toBeEnabled();

    const [buttonFileChooser] = await Promise.all([
      managerPage.waitForEvent("filechooser"),
      managerPage.getByTestId("manager-upload-button").click()
    ]);
    await buttonFileChooser.setFiles(workbookPath);
    await expect(managerPage.getByText("Imported 3 projects.")).toBeVisible();
    managerPage.once("dialog", (dialog) => void dialog.accept());
    await managerPage.getByTestId("manager-reset-round").click();
    await expect(managerPage.getByTestId("scoreboard-empty-heading")).toBeVisible();

    await anonymousPage.goto("/");
    await expect(anonymousPage.getByTestId("scoreboard-empty-heading")).toBeVisible();
    await takeShot(managerPage, testInfo.outputPath("manager-reset-empty-state.png"));
  });

  await Promise.all([
    managerContext.close(),
    anonymousContext.close(),
    judgeContext.close(),
    selfBlockedContext.close()
  ]);
});
