#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";

const outputPath = process.argv[2] ?? "artifacts/proof/hackathon-proof-workbook.xlsx";

const rows = [
  {
    "Project Name": "Aurora Atlas",
    "Team Name": "North Star",
    Summary: "A live map for outage recovery teams with route intelligence and field coordination notes.",
    "Team Member 1 Email": "founder@aurora.example",
    "Team Member 2 Email": "judge.self+clerk_test@example.com",
    Sponsor: "OpenAI"
  },
  {
    "Project Name": "Signal Bloom",
    "Team Name": "Bloom Labs",
    Summary: "A carbon-aware operations planner that turns dense emissions data into simple action prompts.",
    "Team Member 1 Email": "builder@signalbloom.example",
    "Team Member 2 Email": "teammate@signalbloom.example",
    Sponsor: "Anthropic"
  },
  {
    "Project Name": "Harbor Pulse",
    "Team Name": "Harbor Collective",
    Summary: "A cash-flow alerting assistant for small teams that need faster decision support during crunch weeks.",
    "Team Member 1 Email": "captain@harborpulse.example",
    "Team Member 2 Email": "ops@harborpulse.example",
    Sponsor: "Vercel"
  }
];

const instructions = [
  ["Hackathon voting workbook"],
  ["Keep one project per row and leave the header row unchanged."],
  ["Project Name is required and should stay unique."],
  ["Include at least one team member email per project so self-voting can be blocked automatically."],
  ["Extra columns are allowed and will be stored as metadata when possible."]
];

const workbook = XLSX.utils.book_new();

XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Entries");
XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(instructions), "Instructions");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
XLSX.writeFile(workbook, outputPath);

console.log(outputPath);
