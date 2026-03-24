import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { COMPETITION_STATE_ID, MANAGER_EMAIL } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { resetCompetitionRound, submitJudgeVote } from "@/lib/competition";

async function resetDatabase() {
  await prisma.vote.deleteMany();
  await prisma.entryTeamEmail.deleteMany();
  await prisma.entry.deleteMany();
  await prisma.competitionState.upsert({
    where: { id: COMPETITION_STATE_ID },
    update: {
      votingStatus: "PREPARING",
      startedAt: null,
      finalizedAt: null,
      managerEmail: MANAGER_EMAIL
    },
    create: {
      id: COMPETITION_STATE_ID,
      votingStatus: "PREPARING",
      startedAt: null,
      managerEmail: MANAGER_EMAIL
    }
  });
}

describe("submitJudgeVote", () => {
  beforeEach(async () => {
    await resetDatabase();
    await prisma.competitionState.update({
      where: { id: COMPETITION_STATE_ID },
      data: {
        votingStatus: "OPEN",
        startedAt: new Date("2026-03-23T12:00:00.000Z")
      }
    });
  });

  afterEach(async () => {
    await resetDatabase();
  });

  it("upserts a judge vote instead of creating duplicates", async () => {
    const entry = await prisma.entry.create({
      data: {
        slug: "aurora-atlas",
        projectName: "Aurora Atlas",
        teamEmails: {
          create: [{ email: "founder@example.com" }]
        }
      }
    });

    await submitJudgeVote({
      entryId: entry.id,
      judgeEmail: "judge@example.com",
      judgeUserId: "user_1",
      score: 6
    });

    await submitJudgeVote({
      entryId: entry.id,
      judgeEmail: "judge@example.com",
      judgeUserId: "user_1",
      score: 8
    });

    const votes = await prisma.vote.findMany({
      where: { entryId: entry.id }
    });

    expect(votes).toHaveLength(1);
    expect(votes[0]?.score).toBe(8);
  });

  it("blocks self-voting when the judge email matches an uploaded team email", async () => {
    const entry = await prisma.entry.create({
      data: {
        slug: "signal-bloom",
        projectName: "Signal Bloom",
        teamEmails: {
          create: [{ email: "judge@example.com" }]
        }
      }
    });

    await expect(
      submitJudgeVote({
        entryId: entry.id,
        judgeEmail: "judge@example.com",
        judgeUserId: "user_2",
        score: 9
      })
    ).rejects.toThrow("Team members cannot vote on their own project.");
  });

  it("resets the round back to an empty preparing state", async () => {
    const entry = await prisma.entry.create({
      data: {
        slug: "harbor-pulse",
        projectName: "Harbor Pulse",
        teamEmails: {
          create: [{ email: "captain@example.com" }]
        }
      }
    });

    await submitJudgeVote({
      entryId: entry.id,
      judgeEmail: "judge@example.com",
      judgeUserId: "user_3",
      score: 7
    });

    await resetCompetitionRound();

    expect(await prisma.entry.count()).toBe(0);
    expect(await prisma.vote.count()).toBe(0);
    expect(
      await prisma.competitionState.findUnique({
        where: { id: COMPETITION_STATE_ID }
      })
    ).toMatchObject({
      votingStatus: "PREPARING",
      startedAt: null,
      finalizedAt: null
    });
  });
});
