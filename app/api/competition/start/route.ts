import { NextResponse } from "next/server";

import { requireManagerIdentity } from "@/lib/auth";
import { beginVotingRound } from "@/lib/competition";

export async function POST() {
  try {
    await requireManagerIdentity();
    await beginVotingRound();

    return NextResponse.json({
      ok: true
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not begin voting."
      },
      { status: 403 }
    );
  }
}
