#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import { chromium } from "playwright";

const REPO_ROOT = process.cwd();
const MANAGER_EMAIL = "rajeev.gill@omc.com";
const JUDGE_EMAIL = "judge.one+clerk_test@example.com";

function parseArg(flag, fallback) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

const baseURL = parseArg("--base-url", "https://vote.rajeevg.com");
const artifactDir = parseArg(
  "--artifacts",
  path.join(REPO_ROOT, "artifacts", "event-day-smoke", new Date().toISOString().replaceAll(":", "-"))
);

fs.mkdirSync(artifactDir, { recursive: true });

function runNodeScript(scriptPath, args, extraEnv = {}) {
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
    .at(-1)
    .trim();
}

function createSignInTicket(email) {
  return runNodeScript(
    path.join(REPO_ROOT, "scripts/create-clerk-sign-in-token.mjs"),
    ["--email", email, "--redirect", "/"],
    { APP_URL: baseURL }
  );
}

function createProofWorkbook(outputPath) {
  return runNodeScript(path.join(REPO_ROOT, "scripts/generate-proof-workbook.mjs"), [outputPath]);
}

async function signInWithTicket(page, email) {
  const ticketUrl = createSignInTicket(email);
  await page.goto(ticketUrl, { waitUntil: "domcontentloaded" });
  await page.waitForURL((url) => url.origin + url.pathname === new URL(baseURL).origin + "/");
}

async function ensureCleanManagerStart(page) {
  console.log("step=manager_sign_in");
  await signInWithTicket(page, MANAGER_EMAIL);
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });

  const stateBadge = page.locator('[data-testid="competition-state-badge"]:visible').first();
  const stateText = (await stateBadge.textContent())?.trim();
  const hasEntries = (await page.getByTestId(/^scoreboard-row-/).count()) > 0;

  if (stateText === "Preparing" && !hasEntries) {
    console.log("step=clean_start_already_preparing");
    return;
  }

  console.log(`step=manager_reset_required state=${stateText ?? "unknown"} hasEntries=${hasEntries}`);
  const resetButton = page.getByTestId("manager-reset-round");
  await resetButton.waitFor({ state: "visible", timeout: 10000 });
  page.once("dialog", (dialog) => void dialog.accept());
  await resetButton.click();
  await page.getByText("Competition reset. Upload a fresh workbook to start the next dry run.").waitFor({
    state: "visible",
    timeout: 15000
  });
  await page.getByTestId("scoreboard-empty-heading").waitFor({ state: "visible", timeout: 15000 });
  console.log("step=manager_reset_complete");
}

async function uploadWorkbook(page, workbookPath) {
  console.log("step=upload_workbook");
  const [fileChooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByTestId("manager-upload-dropzone").click()
  ]);
  await fileChooser.setFiles(workbookPath);
  await page.getByText("Imported 3 projects.").waitFor({ state: "visible", timeout: 15000 });
  await page.locator('[data-testid="scoreboard-row-aurora-atlas"]:visible').first().waitFor({
    state: "visible",
    timeout: 15000
  });
}

async function beginVoting(page) {
  console.log("step=begin_voting");
  await page.getByTestId("manager-begin-voting").click();
  await page.locator('[data-testid="competition-state-badge"]:visible').first().waitFor({ state: "visible" });
}

async function castJudgeVote(page) {
  console.log("step=judge_sign_in");
  await signInWithTicket(page, JUDGE_EMAIL);
  console.log("step=judge_vote");
  await page.locator('[data-testid="scoreboard-action-aurora-atlas"]:visible').first().click();
  await page.getByTestId("score-option-7").click();
  await page.getByTestId("submit-vote").click();
  await page.getByText("Judge", { exact: true }).waitFor({ state: "visible", timeout: 10000 });
  await page.locator('[data-testid="scoreboard-action-aurora-atlas"]:visible').first().waitFor({
    state: "visible",
    timeout: 10000
  });
}

async function assertPublicRefresh(page) {
  console.log("step=public_refresh_check");
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="scoreboard-row-aurora-atlas"]:visible').first().waitFor({
    state: "visible",
    timeout: 10000
  });
  await page.waitForFunction(() => {
    const row = Array.from(document.querySelectorAll('[data-testid="scoreboard-row-aurora-atlas"]')).find(
      (element) => element instanceof HTMLElement && element.offsetParent !== null
    );
    return row?.textContent?.includes("1 vote");
  });
}

const workbookPath = path.join(os.tmpdir(), `event-day-smoke-${Date.now()}.xlsx`);
createProofWorkbook(workbookPath);

const browser = await chromium.launch({ headless: true });
const managerContext = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
  colorScheme: "light",
  acceptDownloads: true
});
const judgeContext = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
  colorScheme: "light"
});
const publicContext = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
  colorScheme: "light",
  storageState: { cookies: [], origins: [] }
});

const managerPage = await managerContext.newPage();
const judgePage = await judgeContext.newPage();
const publicPage = await publicContext.newPage();

try {
  await ensureCleanManagerStart(managerPage);
  console.log("step=public_empty_board_check");
  await publicPage.goto(baseURL, { waitUntil: "domcontentloaded" });
  await publicPage.getByTestId("scoreboard-empty-heading").waitFor({ state: "visible", timeout: 10000 });

  await uploadWorkbook(managerPage, workbookPath);
  await beginVoting(managerPage);
  await castJudgeVote(judgePage);

  console.log("step=manager_tracker_check");
  await managerPage.goto(baseURL, { waitUntil: "domcontentloaded" });
  await managerPage.getByTestId("manager-remaining-votes").waitFor({ state: "visible", timeout: 10000 });

  await assertPublicRefresh(publicPage);
  await publicPage.screenshot({
    path: path.join(artifactDir, "event-day-smoke-public.png"),
    fullPage: true
  });

  const summary = {
    baseURL,
    artifactDir,
    workbookPath,
    result: "pass"
  };

  fs.writeFileSync(path.join(artifactDir, "summary.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
} catch (error) {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  fs.writeFileSync(path.join(artifactDir, "error.txt"), message);
  console.error(message);
  process.exitCode = 1;
} finally {
  await Promise.all([managerContext.close(), judgeContext.close(), publicContext.close()]);
  await browser.close();
}
