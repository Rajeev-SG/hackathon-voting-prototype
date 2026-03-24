import { Prisma } from "@prisma/client";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

import { getViewerIdentity, normalizeEmail } from "@/lib/auth";
import { deriveCompetitionSnapshot, type CompetitionSnapshot } from "@/lib/competition-logic";
import { COMPETITION_STATE_ID, MANAGER_EMAIL, type VotingStatus } from "@/lib/constants";
import { prisma, withPrismaRetry } from "@/lib/prisma";
import { parseEntriesWorkbook } from "@/lib/xlsx";

const PUBLIC_SNAPSHOT_TAG = "competition-public-snapshot";
const anonymousViewer = {
  clerkUserId: null,
  email: null,
  isAuthenticated: false,
  isManager: false
} as const;
const shouldUsePublicSnapshotCache =
  process.env.NODE_ENV === "production" && process.env.DISABLE_PUBLIC_SNAPSHOT_CACHE !== "1";
const voteContextRetryDelayMs = [0, 100, 250, 500, 1000, 2000, 4000];
const voteWriteRetryDelayMs = [0, 50, 125, 250, 500];

async function ensureCompetitionState() {
  const existingState = await withPrismaRetry(() =>
    prisma.competitionState.findUnique({
      where: { id: COMPETITION_STATE_ID }
    })
  );

  if (existingState) {
    return existingState;
  }

  try {
    return await withPrismaRetry(() =>
      prisma.competitionState.create({
        data: {
          id: COMPETITION_STATE_ID,
          managerEmail: MANAGER_EMAIL
        }
      })
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const recoveredState = await withPrismaRetry(() =>
        prisma.competitionState.findUnique({
          where: { id: COMPETITION_STATE_ID }
        })
      );

      if (recoveredState) {
        return recoveredState;
      }
    }

    throw error;
  }
}

function safeRevalidateHome() {
  try {
    revalidatePath("/");
    revalidateTag(PUBLIC_SNAPSHOT_TAG);
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !error.message.includes("static generation store missing")
    ) {
      throw error;
    }
  }
}

async function getCompetitionSnapshotData() {
  const [state, entries] = await Promise.all([
    ensureCompetitionState(),
    withPrismaRetry(() =>
      prisma.entry.findMany({
        include: {
          teamEmails: true,
          votes: {
            orderBy: {
              updatedAt: "desc"
            }
          }
        }
      })
    )
  ]);

  return {
    state,
    entries
  };
}

async function resolveVoteSubmissionContext(entryId: string) {
  let state: Awaited<ReturnType<typeof ensureCompetitionState>> | null = null;
  let entry:
    | Awaited<
        ReturnType<
          typeof prisma.entry.findUnique<{
            where: { id: string };
            include: { teamEmails: true };
          }>
        >
      >
    | null = null;

  for (const delayMs of voteContextRetryDelayMs) {
    if (delayMs > 0) {
      await new Promise((resolve) => {
        setTimeout(resolve, delayMs);
      });
    }

    [state, entry] = await Promise.all([
      ensureCompetitionState(),
      withPrismaRetry(() =>
        prisma.entry.findUnique({
          where: { id: entryId },
          include: {
            teamEmails: true
          }
        })
      )
    ]);

    if (state.votingStatus === "OPEN" && entry) {
      return { state, entry };
    }
  }

  return { state, entry };
}

const getCachedPublicCompetitionSnapshot = unstable_cache(
  async (): Promise<CompetitionSnapshot> => {
    const { state, entries } = await getCompetitionSnapshotData();

    return deriveCompetitionSnapshot({
      status: state.votingStatus,
      startedAt: state.startedAt,
      finalizedAt: state.finalizedAt,
      entries,
      viewer: anonymousViewer
    });
  },
  ["competition-public-snapshot"],
  {
    revalidate: 5,
    tags: [PUBLIC_SNAPSHOT_TAG]
  }
);

export async function getCompetitionSnapshot() {
  const viewer = await getViewerIdentity();
  if (!viewer.isAuthenticated && shouldUsePublicSnapshotCache) {
    return getCachedPublicCompetitionSnapshot();
  }

  const { state, entries } = await getCompetitionSnapshotData();

  return deriveCompetitionSnapshot({
    status: state.votingStatus,
    startedAt: state.startedAt,
    finalizedAt: state.finalizedAt,
    entries,
    viewer
  });
}

export async function replaceEntriesFromWorkbook(buffer: ArrayBuffer | Buffer) {
  const { rows, issues } = parseEntriesWorkbook(buffer);

  if (issues.length) {
    return {
      ok: false as const,
      issues
    };
  }

  const state = await ensureCompetitionState();
  if (state.votingStatus !== "PREPARING") {
    throw new Error("Entries can only be replaced before voting begins.");
  }

  await withPrismaRetry(() =>
    prisma.$transaction(async (tx) => {
      await tx.vote.deleteMany();
      await tx.entryTeamEmail.deleteMany();
      await tx.entry.deleteMany();

    for (const row of rows) {
      await tx.entry.create({
        data: {
          slug: row.slug,
          projectName: row.projectName,
          teamName: row.teamName,
          summary: row.summary,
          isVotingOpen: true,
          metadata: Object.keys(row.metadata).length ? row.metadata : Prisma.JsonNull,
          teamEmails: {
            create: row.teamEmails.map((email) => ({
              email
            }))
          }
        }
      });
    }

      await tx.competitionState.update({
        where: { id: COMPETITION_STATE_ID },
        data: {
          votingStatus: "PREPARING",
          startedAt: null,
          finalizedAt: null
        }
      });
    })
  );

  safeRevalidateHome();

  return {
    ok: true as const,
    importedCount: rows.length
  };
}

export async function beginVotingRound() {
  const state = await ensureCompetitionState();
  if (state.votingStatus !== "PREPARING") {
    throw new Error("Voting has already started or been finalized.");
  }

  const entryCount = await withPrismaRetry(() => prisma.entry.count());
  if (entryCount === 0) {
    throw new Error("Upload at least one entry before opening voting.");
  }

  const openEntryCount = await withPrismaRetry(() =>
    prisma.entry.count({
      where: {
        isVotingOpen: true
      }
    })
  );
  if (openEntryCount === 0) {
    throw new Error("Reopen at least one project before beginning voting.");
  }

  await withPrismaRetry(() =>
    prisma.competitionState.update({
      where: { id: COMPETITION_STATE_ID },
      data: {
        votingStatus: "OPEN",
        startedAt: new Date(),
        finalizedAt: null
      }
    })
  );

  safeRevalidateHome();
}

export async function resetCompetitionRound() {
  await ensureCompetitionState();

  await withPrismaRetry(() =>
    prisma.$transaction(async (tx) => {
      await tx.vote.deleteMany();
      await tx.entryTeamEmail.deleteMany();
      await tx.entry.deleteMany();
      await tx.competitionState.update({
        where: { id: COMPETITION_STATE_ID },
        data: {
          votingStatus: "PREPARING",
          startedAt: null,
          finalizedAt: null
        }
      });
    })
  );

  safeRevalidateHome();
}

export async function submitJudgeVote({
  entryId,
  judgeEmail,
  judgeUserId,
  score
}: {
  entryId: string;
  judgeEmail: string;
  judgeUserId: string | null;
  score: number;
}) {
  if (!Number.isInteger(score) || score < 0 || score > 10) {
    throw new Error("Scores must be whole numbers from 0 to 10.");
  }

  // Short retries cover pooled/remote database lag right after the manager opens the
  // round or immediately after a workbook-driven entry set is created.
  const { state, entry } = await resolveVoteSubmissionContext(entryId);

  if (!state || state.votingStatus !== "OPEN") {
    throw new Error("Voting is not currently open.");
  }

  if (!entry) {
    throw new Error("That project could not be found.");
  }

  if (!entry.isVotingOpen) {
    throw new Error("Voting is currently closed for this project.");
  }

  const normalizedJudgeEmail = normalizeEmail(judgeEmail);
  const isBlocked = entry.teamEmails.some(
    (teamMember) => normalizeEmail(teamMember.email) === normalizedJudgeEmail
  );

  if (isBlocked) {
    throw new Error("Team members cannot vote on their own project.");
  }

  for (const delayMs of voteWriteRetryDelayMs) {
    if (delayMs > 0) {
      await new Promise((resolve) => {
        setTimeout(resolve, delayMs);
      });
    }

    try {
      await withPrismaRetry(() =>
        prisma.vote.create({
          data: {
            entryId,
            judgeEmail: normalizedJudgeEmail,
            judgeUserId,
            score
          }
        })
      );
      safeRevalidateHome();
      return;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new Error("You've already scored this project. Votes lock after submission.");
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        const latestContext = await resolveVoteSubmissionContext(entryId);

        if (!latestContext.state || latestContext.state.votingStatus !== "OPEN") {
          throw new Error("Voting is not currently open.");
        }

        if (!latestContext.entry) {
          if (delayMs === voteWriteRetryDelayMs.at(-1)) {
            throw new Error("That project is no longer available. Refresh the board and try again.");
          }

          continue;
        }

        if (!latestContext.entry.isVotingOpen) {
          throw new Error("Voting is currently closed for this project.");
        }

        if (delayMs !== voteWriteRetryDelayMs.at(-1)) {
          continue;
        }
      }

      throw error;
    }
  }

  throw new Error("We could not save that vote right now. Refresh the board and try again.");
}

export async function setEntryVotingAvailability({
  entryId,
  isVotingOpen
}: {
  entryId: string;
  isVotingOpen: boolean;
}) {
  const state = await ensureCompetitionState();
  if (state.votingStatus === "FINALIZED") {
    throw new Error("Entries cannot be reopened or closed after finalization.");
  }

  const entry = await withPrismaRetry(() =>
    prisma.entry.findUnique({
      where: { id: entryId }
    })
  );

  if (!entry) {
    throw new Error("That project could not be found.");
  }

  if (entry.isVotingOpen === isVotingOpen) {
    return;
  }

  if (state.votingStatus === "PREPARING" && !isVotingOpen) {
    const otherOpenEntries = await withPrismaRetry(() =>
      prisma.entry.count({
        where: {
          isVotingOpen: true,
          id: {
            not: entryId
          }
        }
      })
    );

    if (otherOpenEntries === 0) {
      throw new Error("Keep at least one project open before judging starts.");
    }
  }

  await withPrismaRetry(() =>
    prisma.entry.update({
      where: { id: entryId },
      data: { isVotingOpen }
    })
  );

  safeRevalidateHome();
}

export async function finalizeVotingRound() {
  const snapshot = await getCompetitionSnapshot();
  if (snapshot.status !== "OPEN") {
    throw new Error("Only an open judging round can be finalized.");
  }

  if (!snapshot.progress.isComplete) {
    throw new Error("Judging is not complete yet.");
  }

  await withPrismaRetry(() =>
    prisma.competitionState.update({
      where: { id: COMPETITION_STATE_ID },
      data: {
        votingStatus: "FINALIZED",
        finalizedAt: new Date()
      }
    })
  );

  safeRevalidateHome();
}

export async function getCompetitionStatus() {
  const state = await ensureCompetitionState();
  return state.votingStatus;
}

export function isVotingOpen(status: VotingStatus) {
  return status === "OPEN";
}
