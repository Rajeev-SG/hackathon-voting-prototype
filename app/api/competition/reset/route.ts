import { NextResponse } from "next/server";

import { requireManagerIdentity } from "@/lib/auth";
import { resetCompetitionRound } from "@/lib/competition";

export const runtime = "nodejs";

export async function POST() {
  try {
    await requireManagerIdentity();
    await resetCompetitionRound();

    return NextResponse.json(
      {
        ok: true
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Competition reset failed."
      },
      { status: 403 }
    );
  }
}
