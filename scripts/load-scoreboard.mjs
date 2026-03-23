#!/usr/bin/env node

import process from "node:process";
import { performance } from "node:perf_hooks";

function parseArg(flag, fallback) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  return value ?? fallback;
}

const url = parseArg("--url", "https://vote.rajeevg.com");
const concurrency = Number(parseArg("--concurrency", "50"));
const requests = Number(parseArg("--requests", "250"));

if (!Number.isFinite(concurrency) || concurrency <= 0 || !Number.isFinite(requests) || requests <= 0) {
  console.error("Concurrency and requests must be positive numbers.");
  process.exit(1);
}

const durations = [];
const statusCounts = new Map();
let completed = 0;
let failures = 0;
let pointer = 0;

async function runOne(requestNumber) {
  const startedAt = performance.now();

  try {
    const response = await fetch(url, {
      redirect: "follow"
    });
    const body = await response.text();
    const elapsedMs = performance.now() - startedAt;

    durations.push(elapsedMs);
    statusCounts.set(response.status, (statusCounts.get(response.status) ?? 0) + 1);

    if (!body.includes("Hackathon scoreboard")) {
      failures += 1;
      console.error(`Request ${requestNumber} returned ${response.status} without the scoreboard heading.`);
    }
  } catch (error) {
    failures += 1;
    console.error(`Request ${requestNumber} failed:`, error instanceof Error ? error.message : error);
  } finally {
    completed += 1;
  }
}

async function worker() {
  while (pointer < requests) {
    pointer += 1;
    const requestNumber = pointer;
    await runOne(requestNumber);
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));

durations.sort((left, right) => left - right);

function percentile(value) {
  if (!durations.length) return 0;
  const index = Math.min(durations.length - 1, Math.floor((value / 100) * durations.length));
  return durations[index];
}

console.log(
  JSON.stringify(
    {
      url,
      concurrency,
      requests,
      completed,
      failures,
      p50Ms: Number(percentile(50).toFixed(2)),
      p95Ms: Number(percentile(95).toFixed(2)),
      p99Ms: Number(percentile(99).toFixed(2)),
      maxMs: Number((durations.at(-1) ?? 0).toFixed(2)),
      statuses: Object.fromEntries(statusCounts)
    },
    null,
    2
  )
);
