#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";

const outputPath = process.argv[2] ?? "artifacts/proof/hackathon-proof-workbook.xlsx";

const rows = [
  {
    "Project Name": "Aurora Atlas",
    "Team Name": "North Star",
    Track: "AI",
    Booth: "Booth A1",
    Summary: "A live map for outage recovery teams with route intelligence and field coordination notes.",
    "Demo URL": "https://example.com/aurora",
    "Repository URL": "https://github.com/example/aurora-atlas",
    "Team Member 1 Email": "founder@aurora.example",
    "Team Member 2 Email": "judge.self+clerk_test@example.com",
    Sponsor: "OpenAI"
  },
  {
    "Project Name": "Signal Bloom",
    "Team Name": "Bloom Labs",
    Track: "Climate",
    Booth: "Booth B2",
    Summary: "A carbon-aware operations planner that turns dense emissions data into simple action prompts.",
    "Demo URL": "https://example.com/signal-bloom",
    "Repository URL": "https://github.com/example/signal-bloom",
    "Team Member 1 Email": "builder@signalbloom.example",
    "Team Member 2 Email": "teammate@signalbloom.example",
    Sponsor: "Anthropic"
  },
  {
    "Project Name": "Harbor Pulse",
    "Team Name": "Harbor Collective",
    Track: "Fintech",
    Booth: "Booth C4",
    Summary: "A cash-flow alerting assistant for small teams that need faster decision support during crunch weeks.",
    "Demo URL": "https://example.com/harbor-pulse",
    "Repository URL": "https://github.com/example/harbor-pulse",
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
