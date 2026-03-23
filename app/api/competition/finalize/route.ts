import { NextResponse } from "next/server";

import { requireManagerIdentity } from "@/lib/auth";
import { finalizeVotingRound } from "@/lib/competition";

export async function POST() {
  try {
    await requireManagerIdentity();
    await finalizeVotingRound();

    return NextResponse.json({
      ok: true
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not finalize judging."
      },
      { status: 403 }
    );
  }
}
