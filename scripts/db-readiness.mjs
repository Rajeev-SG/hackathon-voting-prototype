#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import process from "node:process";

import pg from "pg";

const { Client } = pg;

const scoreboardSignals = [
  "Live hackathon scoreboard",
  "Single-screen scoreboard",
  "data-testid=\"scoreboard-section\"",
  "data-testid=\"scoreboard-empty-heading\""
];
const knownDatabaseProducts = ["Neon", "Prisma Postgres", "Postgres", "Supabase", "PlanetScale"];

function parseArg(flag, fallback) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

function runCommand(command, args) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8"
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `${command} ${args.join(" ")} failed`);
  }

  return `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
}

function parseTable(output, headerPrefix) {
  return output
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() && !line.startsWith(">") && !line.startsWith(headerPrefix))
    .map((line) => line.trim().split(/\s{2,}/))
    .filter((columns) => columns.length >= 4);
}

function parseIntegrationRows(output) {
  return parseTable(output, "Name").map((columns) => {
    const [name = "", status = "", product = "", integration = "", projects = ""] = columns;
    return { name, status, product, integration, projects };
  });
}

function parseEnvRows(output) {
  return parseTable(output, "name").map((columns) => {
    const [name = "", value = "", environments = "", created = ""] = columns;
    return { name, value, environments, created };
  });
}

async function queryDatabase(connectionString) {
  const client = new Client({
    connectionString,
    ssl:
      connectionString.includes("sslmode=require") || connectionString.includes("neon.tech")
        ? { rejectUnauthorized: false }
        : undefined
  });

  await client.connect();

  try {
    const result = await client.query(
      "select current_database() as current_database, current_user as current_user, now() as checked_at"
    );
    return result.rows[0];
  } finally {
    await client.end();
  }
}

async function main() {
  const url = parseArg("--url", "https://vote.rajeevg.com");
  const runtimeUrl = process.env.HOTFIX_DATABASE_URL || process.env.DATABASE_URL || "";
  const integrationRows = parseIntegrationRows(runCommand("vercel", ["integration", "ls"]));
  const envRows = parseEnvRows(runCommand("vercel", ["env", "ls", "production"]));
  const envNames = new Set(envRows.map((row) => row.name));
  const databaseResources = integrationRows.filter((row) =>
    knownDatabaseProducts.some((product) => row.product.includes(product))
  );
  const hotfixResource = integrationRows.find((row) => row.name === "neon-hotfix");
  const availableDatabaseResources = databaseResources.filter((row) => row.status.includes("Available"));
  const response = await fetch(url, { redirect: "follow" });
  const body = await response.text();

  let databaseCheck = null;
  let databaseError = null;

  if (runtimeUrl) {
    try {
      databaseCheck = await queryDatabase(runtimeUrl);
    } catch (error) {
      databaseError = error instanceof Error ? error.message : String(error);
    }
  }

  const summary = {
    url,
    publicSite: {
      ok: response.ok,
      status: response.status,
      scoreboardSignalPresent: scoreboardSignals.some((signal) => body.includes(signal))
    },
    integrations: {
      hotfixResourceStatus: hotfixResource?.status ?? "missing",
      availableDatabaseResources: availableDatabaseResources.map((row) => ({
        name: row.name,
        product: row.product,
        status: row.status
      })),
      suspendedDatabaseResources: databaseResources
        .filter((row) => row.status.includes("Suspended"))
        .map((row) => ({
          name: row.name,
          product: row.product,
          status: row.status
        }))
    },
    productionEnv: {
      hasHotfixRuntimeUrl: envNames.has("HOTFIX_DATABASE_URL"),
      hasHotfixMigrationUrl: envNames.has("HOTFIX_DATABASE_URL_UNPOOLED"),
      hasManagerEmailOverride: envNames.has("MANAGER_EMAIL")
    },
    databaseConnection: runtimeUrl
      ? {
          ok: Boolean(databaseCheck),
          usingHotfixUrl: Boolean(process.env.HOTFIX_DATABASE_URL),
          currentDatabase: databaseCheck?.current_database ?? null,
          currentUser: databaseCheck?.current_user ?? null,
          error: databaseError
        }
      : {
          ok: false,
          skipped: true,
          reason: "HOTFIX_DATABASE_URL or DATABASE_URL was not provided in the local shell."
        }
  };

  console.log(JSON.stringify(summary, null, 2));

  const failures = [
    !summary.publicSite.ok,
    !summary.publicSite.scoreboardSignalPresent,
    !summary.productionEnv.hasHotfixRuntimeUrl,
    !summary.productionEnv.hasHotfixMigrationUrl,
    hotfixResource?.status !== "● Available",
    availableDatabaseResources.length === 0,
    runtimeUrl ? !summary.databaseConnection.ok : false
  ];

  if (failures.some(Boolean)) {
    process.exit(1);
  }
}

await main();
