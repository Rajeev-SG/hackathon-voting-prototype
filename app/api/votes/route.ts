import { NextResponse } from "next/server";
import { z } from "zod";

import { requireJudgeIdentity } from "@/lib/auth";
import { submitJudgeVote } from "@/lib/competition";

const voteSchema = z.object({
  entryId: z.string().min(1),
  score: z.number().int().min(0).max(10)
});

export async function POST(request: Request) {
  try {
    const judge = await requireJudgeIdentity();
    const json = await request.json();
    const payload = voteSchema.parse(json);

    await submitJudgeVote({
      entryId: payload.entryId,
      score: payload.score,
      judgeEmail: judge.email ?? "",
      judgeUserId: judge.clerkUserId
    });

    return NextResponse.json({
      ok: true
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not save vote."
      },
      { status: 403 }
    );
  }
}
