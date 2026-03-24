import process from "node:process";
import { defineConfig, devices } from "playwright/test";

process.loadEnvFile?.(".env.local");

const localPort = 3017;
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${localPort}`;
const isLocalTarget = /127\.0\.0\.1|localhost/.test(baseURL);
const repoRoot = process.cwd();
const usesClerkTestKeys = (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "").startsWith("pk_test_");
const localWebServerCommand = usesClerkTestKeys
  ? `zsh -lc 'set -a; source .env.local; set +a; pnpm dev --port ${localPort}'`
  : `zsh -lc 'set -a; source .env.local; set +a; pnpm start --port ${localPort}'`;

export default defineConfig({
  testDir: `${repoRoot}/tests/e2e`,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  outputDir: `${repoRoot}/artifacts/playwright`,
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "artifacts/playwright-report" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  workers: 1,
  projects: [
    {
      name: "desktop-light",
      use: {
        browserName: "chromium",
        viewport: { width: 1440, height: 1100 },
        colorScheme: "light"
      }
    },
    {
      name: "mobile-dark",
      use: {
        ...devices["Pixel 7"],
        colorScheme: "dark"
      }
    }
  ],
  webServer: isLocalTarget
    ? {
        command: localWebServerCommand,
        port: localPort,
        reuseExistingServer: true,
        timeout: 120000
      }
    : undefined
});
