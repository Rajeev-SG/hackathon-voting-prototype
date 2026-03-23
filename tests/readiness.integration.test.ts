import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { submitJudgeVote } from "@/lib/competition";
import { deriveCompetitionSnapshot } from "@/lib/competition-logic";
import { COMPETITION_STATE_ID, MANAGER_EMAIL } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

const anonymousViewer = {
  clerkUserId: null,
  email: null,
  isAuthenticated: false,
  isManager: false
} as const;

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
      finalizedAt: null,
      managerEmail: MANAGER_EMAIL
    }
  });
}

async function openVotingRound() {
  await prisma.competitionState.update({
    where: { id: COMPETITION_STATE_ID },
    data: {
      votingStatus: "OPEN",
      startedAt: new Date("2026-03-23T12:00:00.000Z"),
      finalizedAt: null
    }
  });
}

async function createEntries({
  entryCount,
  blockedJudges = []
}: {
  entryCount: number;
  blockedJudges?: string[];
}) {
  const entries = [];

  for (let index = 0; index < entryCount; index += 1) {
    const blockedJudge = blockedJudges[index] ?? `team-${index + 1}@example.com`;
    const entry = await prisma.entry.create({
      data: {
        slug: `readiness-entry-${index + 1}`,
        projectName: `Readiness Entry ${index + 1}`,
        teamName: `Team ${index + 1}`,
        summary: `Synthetic readiness entry ${index + 1}.`,
        teamEmails: {
          create: [{ email: blockedJudge }]
        }
      }
    });
    entries.push(entry);
  }

  return entries;
}

async function getSnapshot() {
  const entries = await prisma.entry.findMany({
    include: {
      teamEmails: true,
      votes: {
        orderBy: {
          updatedAt: "desc"
        }
      }
    }
  });

  return deriveCompetitionSnapshot({
    status: "OPEN",
    startedAt: new Date("2026-03-23T12:00:00.000Z"),
    finalizedAt: null,
    entries,
    viewer: anonymousViewer
  });
}

async function submitVotingWave({
  entries,
  judges,
  scoreOffset = 0,
  blockedJudgeByEntry = []
}: {
  entries: Awaited<ReturnType<typeof createEntries>>;
  judges: string[];
  scoreOffset?: number;
  blockedJudgeByEntry?: string[];
}) {
  for (const [entryIndex, entry] of entries.entries()) {
    const results = await Promise.allSettled(
      judges
        .filter((judgeEmail) => blockedJudgeByEntry[entryIndex] !== judgeEmail)
        .map((judgeEmail, judgeIndex) =>
          submitJudgeVote({
            entryId: entry.id,
            judgeEmail,
            judgeUserId: `user_${judgeIndex + 1}`,
            score: (judgeIndex + entryIndex + scoreOffset) % 11
          })
        )
    );

    const rejectionMessages = results
      .filter((result): result is PromiseRejectedResult => result.status === "rejected")
      .map((result) => (result.reason instanceof Error ? result.reason.message : String(result.reason)));

    expect(rejectionMessages).toEqual([]);
  }
}

describe("event-day readiness", () => {
  beforeEach(async () => {
    await resetDatabase();
    await openVotingRound();
  });

  afterEach(async () => {
    await resetDatabase();
  });

  it(
    "handles 50 concurrent judges scoring 4 entries without missing votes",
    async () => {
      const entries = await createEntries({ entryCount: 4 });
      const judges = Array.from({ length: 50 }, (_, index) => `judge-${index + 1}@example.com`);

      await submitVotingWave({
        entries,
        judges
      });

      expect(await prisma.vote.count()).toBe(200);

      const snapshot = await getSnapshot();
      expect(snapshot.progress.participatingJudgeCount).toBe(50);
      expect(snapshot.progress.entryCount).toBe(4);
      expect(snapshot.progress.castVotes).toBe(200);
      expect(snapshot.progress.expectedVotes).toBe(200);
      expect(snapshot.progress.percentage).toBe(100);
      expect(snapshot.progress.isComplete).toBe(true);
    },
    30000
  );

  it(
    "keeps completion accurate when self-vote exclusions remove entries from the denominator",
    async () => {
      const judges = Array.from({ length: 50 }, (_, index) => `judge-${index + 1}@example.com`);
      const blockedJudges = judges.slice(0, 5);
      const entries = await createEntries({
        entryCount: 5,
        blockedJudges
      });

      await submitVotingWave({
        entries,
        judges,
        scoreOffset: 3,
        blockedJudgeByEntry: blockedJudges
      });

      expect(await prisma.vote.count()).toBe(245);

      const snapshot = await getSnapshot();
      expect(snapshot.progress.participatingJudgeCount).toBe(50);
      expect(snapshot.progress.entryCount).toBe(5);
      expect(snapshot.progress.castVotes).toBe(245);
      expect(snapshot.progress.expectedVotes).toBe(245);
      expect(snapshot.progress.percentage).toBe(100);
      expect(snapshot.progress.isComplete).toBe(true);
    },
    30000
  );
});
