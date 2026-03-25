import { NextResponse } from "next/server";

import { getPublicCompetitionSummary } from "@/lib/competition";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const summary = await getPublicCompetitionSummary();

    return NextResponse.json(summary, {
      headers: {
        "Cache-Control": "public, s-maxage=5, stale-while-revalidate=30"
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not load the public competition summary."
      },
      { status: 500 }
    );
  }
}
