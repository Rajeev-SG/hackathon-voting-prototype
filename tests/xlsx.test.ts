import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";

import { FINALIZED_RESULTS_SHEET, TEMPLATE_SHEET_NAME } from "@/lib/constants";
import { buildFinalizedResultsWorkbook, parseEntriesWorkbook } from "@/lib/xlsx";

function workbookBuffer(rows: Array<Array<string>>) {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), TEMPLATE_SHEET_NAME);
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

describe("parseEntriesWorkbook", () => {
  it("parses rows, captures metadata, and tolerates extra columns", () => {
    const buffer = workbookBuffer([
      ["Project Name", "Team Name", "Summary", "Team Member 1 Email", "Sponsor"],
      ["Aurora Atlas", "North Star", "A live response map", "founder@example.com", "Acme"]
    ]);

    const result = parseEntriesWorkbook(buffer);

    expect(result.issues).toEqual([]);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      projectName: "Aurora Atlas",
      teamName: "North Star",
      summary: "A live response map",
      teamEmails: ["founder@example.com"],
      metadata: {
        Sponsor: "Acme"
      }
    });
  });

  it("reports validation issues for rows without team emails", () => {
    const buffer = workbookBuffer([
      ["Project Name", "Summary"],
      ["Missing Emails", "Still needs team emails"]
    ]);

    const result = parseEntriesWorkbook(buffer);

    expect(result.rows).toHaveLength(0);
    expect(result.issues[0]?.message).toContain("At least one team member email is required");
  });

  it("treats removed legacy columns as harmless metadata", () => {
    const buffer = workbookBuffer([
      ["Project Name", "Team Name", "Track", "Booth", "Demo URL", "Team Member 1 Email"],
      ["Aurora Atlas", "North Star", "AI", "A-4", "https://example.com/demo", "founder@example.com"]
    ]);

    const result = parseEntriesWorkbook(buffer);

    expect(result.issues).toEqual([]);
    expect(result.rows[0]?.metadata).toMatchObject({
      Track: "AI",
      Booth: "A-4",
      "Demo URL": "https://example.com/demo"
    });
  });
});

describe("buildFinalizedResultsWorkbook", () => {
  it("exports finalized scores with aggregate totals", () => {
    const buffer = buildFinalizedResultsWorkbook([
      {
        rank: 1,
        projectName: "Aurora Atlas",
        teamName: "North Star",
        totalScore: 19,
        voteCount: 2,
        averageScore: 9.5
      }
    ]);

    const workbook = XLSX.read(buffer, { type: "buffer" });
    const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(
      workbook.Sheets[FINALIZED_RESULTS_SHEET]
    );

    expect(rows[0]).toMatchObject({
      Rank: 1,
      "Project Name": "Aurora Atlas",
      "Aggregate Score": 19,
      "Vote Count": 2
    });
  });
});
