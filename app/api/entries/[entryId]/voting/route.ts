import { NextResponse } from "next/server";
import { z } from "zod";

import { requireManagerIdentity } from "@/lib/auth";
import { setEntryVotingAvailability } from "@/lib/competition";

const payloadSchema = z.object({
  isVotingOpen: z.boolean()
});

export async function PATCH(
  request: Request,
  { params }: { params: { entryId: string } }
) {
  try {
    await requireManagerIdentity();
    const json = await request.json();
    const payload = payloadSchema.parse(json);

    await setEntryVotingAvailability({
      entryId: params.entryId,
      isVotingOpen: payload.isVotingOpen
    });

    return NextResponse.json({
      ok: true
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not update project voting."
      },
      { status: 403 }
    );
  }
}
