import * as XLSX from "xlsx";

import {
  FINALIZED_RESULTS_SHEET,
  MAX_TEAM_EMAIL_COLUMNS,
  TEMPLATE_INSTRUCTIONS_SHEET,
  TEMPLATE_SHEET_NAME
} from "@/lib/constants";
import { normalizeEmail } from "@/lib/auth";
import { slugifyProjectName } from "@/lib/competition-logic";

export type ParsedEntryRow = {
  projectName: string;
  slug: string;
  teamName: string | null;
  track: string | null;
  booth: string | null;
  summary: string | null;
  demoUrl: string | null;
  repositoryUrl: string | null;
  imageUrl: string | null;
  teamEmails: string[];
  metadata: Record<string, string>;
};

export type WorkbookValidationIssue = {
  rowNumber: number;
  field: string;
  message: string;
};

function normaliseHeader(header: string) {
  return header.trim().toLowerCase().replace(/\s+/g, " ");
}

function readCell(row: Record<string, unknown>, headers: string[], fallback = "") {
  for (const header of headers) {
    const value = row[header];
    if (typeof value === "string") return value.trim();
    if (typeof value === "number") return String(value);
  }

  return fallback;
}

function isKnownMetadataHeader(header: string) {
  return [
    "project name",
    "team name",
    "track",
    "booth",
    "summary",
    "demo url",
    "repository url",
    "image url"
  ].includes(header);
}

export function parseEntriesWorkbook(buffer: ArrayBuffer | Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[TEMPLATE_SHEET_NAME] ?? workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: ""
  });

  const issues: WorkbookValidationIssue[] = [];
  const seenNames = new Set<string>();
  const rows: ParsedEntryRow[] = [];

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const originalHeaders = Object.keys(row);
    const headerMap = new Map(originalHeaders.map((header) => [normaliseHeader(header), header]));
    const normalizedHeaders = Array.from(headerMap.keys());
    const projectName = readCell(row, [headerMap.get("project name") ?? ""]).trim();

    const hasAnyContent = originalHeaders.some((header) => {
      const value = row[header];
      return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
    });

    if (!hasAnyContent) {
      return;
    }

    if (!projectName) {
      issues.push({
        rowNumber,
        field: "project name",
        message: "Project name is required."
      });
      return;
    }

    const normalizedProjectName = projectName.toLowerCase();
    if (seenNames.has(normalizedProjectName)) {
      issues.push({
        rowNumber,
        field: "project name",
        message: `Duplicate project name "${projectName}" found.`
      });
      return;
    }

    const emailHeaders = normalizedHeaders.filter((header) => header.includes("email"));
    const teamEmails = emailHeaders
      .map((header) => readCell(row, [headerMap.get(header) ?? ""]))
      .map((email) => normalizeEmail(email))
      .filter(Boolean);

    if (!teamEmails.length) {
      issues.push({
        rowNumber,
        field: "team member email",
        message: "At least one team member email is required so self-voting can be blocked."
      });
      return;
    }

    const invalidEmail = teamEmails.find((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    if (invalidEmail) {
      issues.push({
        rowNumber,
        field: "team member email",
        message: `Invalid team email "${invalidEmail}".`
      });
      return;
    }

    seenNames.add(normalizedProjectName);

    const metadata: Record<string, string> = {};
    originalHeaders.forEach((header) => {
      const normalizedHeader = normaliseHeader(header);
      if (normalizedHeader.includes("email") || isKnownMetadataHeader(normalizedHeader)) return;
      const value = readCell(row, [header], "");
      if (value) metadata[header] = value;
    });

    rows.push({
      projectName,
      slug: slugifyProjectName(projectName),
      teamName: readCell(row, [headerMap.get("team name") ?? ""]) || null,
      track: readCell(row, [headerMap.get("track") ?? ""]) || null,
      booth: readCell(row, [headerMap.get("booth") ?? ""]) || null,
      summary: readCell(row, [headerMap.get("summary") ?? ""]) || null,
      demoUrl: readCell(row, [headerMap.get("demo url") ?? ""]) || null,
      repositoryUrl: readCell(row, [headerMap.get("repository url") ?? ""]) || null,
      imageUrl: readCell(row, [headerMap.get("image url") ?? ""]) || null,
      teamEmails: Array.from(new Set(teamEmails)),
      metadata
    });
  });

  return {
    rows,
    issues
  };
}

export function buildTemplateWorkbook() {
  const workbook = XLSX.utils.book_new();
  const entryHeaders = [
    "Project Name",
    "Team Name",
    "Track",
    "Booth",
    "Summary",
    "Demo URL",
    "Repository URL",
    "Image URL",
    ...Array.from({ length: MAX_TEAM_EMAIL_COLUMNS }, (_, index) => `Team Member ${index + 1} Email`),
    "Optional Note"
  ];
  const entryData = [
    entryHeaders,
    [
      "Aurora Atlas",
      "Team North Star",
      "AI & ML",
      "Booth 14",
      "An AI assistant for hackathon project triage.",
      "https://demo.example.com/aurora-atlas",
      "https://github.com/example/aurora-atlas",
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
      "founder@example.com",
      "designer@example.com",
      "",
      "",
      "Extra columns are allowed and will be preserved as metadata."
    ]
  ];

  const instructionsData = [
    ["How to use this workbook"],
    ["1. Fill one row per project on the Entries sheet."],
    ["2. Keep Project Name unique."],
    ["3. Include at least one team member email per project so self-voting can be blocked."],
    ["4. Extra columns are allowed. Unknown columns are stored as metadata and ignored by scoring."],
    ["5. Upload the completed file before voting begins."]
  ];

  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(entryData), TEMPLATE_SHEET_NAME);
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet(instructionsData),
    TEMPLATE_INSTRUCTIONS_SHEET
  );

  return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
}

export function buildFinalizedResultsWorkbook(
  rows: Array<{
    rank: number;
    projectName: string;
    teamName: string | null;
    track: string | null;
    booth: string | null;
    totalScore: number;
    voteCount: number;
    averageScore: number | null;
  }>
) {
  const workbook = XLSX.utils.book_new();
  const exportRows = rows.map((row) => ({
    Rank: row.rank,
    "Project Name": row.projectName,
    "Team Name": row.teamName ?? "",
    Track: row.track ?? "",
    Booth: row.booth ?? "",
    "Aggregate Score": row.totalScore,
    "Vote Count": row.voteCount,
    "Average Score": row.averageScore ?? ""
  }));

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(exportRows),
    FINALIZED_RESULTS_SHEET
  );

  return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
}
