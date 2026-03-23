import { NextResponse } from "next/server";

import { requireManagerIdentity } from "@/lib/auth";
import { getCompetitionSnapshot } from "@/lib/competition";
import { buildFinalizedResultsWorkbook } from "@/lib/xlsx";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireManagerIdentity();
    const snapshot = await getCompetitionSnapshot();

    if (snapshot.status !== "FINALIZED") {
      return NextResponse.json(
        {
          error: "Results are not finalized yet."
        },
        { status: 409 }
      );
    }

    const workbook = buildFinalizedResultsWorkbook(snapshot.entries);
    return new NextResponse(workbook, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="hackathon-finalized-scores.xlsx"'
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Export failed."
      },
      { status: 403 }
    );
  }
}
