#!/usr/bin/env node
// cli/generate.mjs
//
// Generate theme output files from a palette JSON.
// Usage:
//   node cli/generate.mjs --in cli/palette.example.json --out dist
//
// Node 18+

import fs from "node:fs";
import path from "node:path";
import { generateAllFiles } from "../src/theme.js";

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a === "--in" && next) { out.in = next; i++; continue; }
    if (a === "--out" && next) { out.out = next; i++; continue; }
  }
  return out;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

const args = parseArgs(process.argv);
if (!args.in || !args.out) {
  console.error("Usage: node cli/generate.mjs --in <palette.json> --out <dir>");
  process.exit(1);
}

const inputPath = path.resolve(process.cwd(), args.in);
const outputDir = path.resolve(process.cwd(), args.out);

const raw = fs.readFileSync(inputPath, "utf8");
const cfg = JSON.parse(raw);

const palette = cfg.palette;
const radius = cfg.radius ?? "0.75rem";

const files = generateAllFiles({ palette, radius });

ensureDir(outputDir);

for (const [rel, content] of Object.entries(files)) {
  const p = path.join(outputDir, rel);
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, content, "utf8");
}

console.log(`Wrote ${Object.keys(files).length} files into: ${outputDir}`);
