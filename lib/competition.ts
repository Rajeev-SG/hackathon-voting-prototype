import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { getViewerIdentity, normalizeEmail } from "@/lib/auth";
import { deriveCompetitionSnapshot } from "@/lib/competition-logic";
import { COMPETITION_STATE_ID, MANAGER_EMAIL, type VotingStatus } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { parseEntriesWorkbook } from "@/lib/xlsx";

async function ensureCompetitionState() {
  return prisma.competitionState.upsert({
    where: { id: COMPETITION_STATE_ID },
    update: {},
    create: {
      id: COMPETITION_STATE_ID,
      managerEmail: MANAGER_EMAIL
    }
  });
}

function safeRevalidateHome() {
  try {
    revalidatePath("/");
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !error.message.includes("static generation store missing")
    ) {
      throw error;
    }
  }
}

export async function getCompetitionSnapshot() {
  const viewer = await getViewerIdentity();
  const [state, entries] = await Promise.all([
    ensureCompetitionState(),
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
  ]);

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

  await prisma.$transaction(async (tx) => {
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
  });

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

  const entryCount = await prisma.entry.count();
  if (entryCount === 0) {
    throw new Error("Upload at least one entry before opening voting.");
  }

  await prisma.competitionState.update({
    where: { id: COMPETITION_STATE_ID },
    data: {
      votingStatus: "OPEN",
      startedAt: new Date(),
      finalizedAt: null
    }
  });

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

  const [state, entry] = await Promise.all([
    ensureCompetitionState(),
    prisma.entry.findUnique({
      where: { id: entryId },
      include: {
        teamEmails: true
      }
    })
  ]);

  if (state.votingStatus !== "OPEN") {
    throw new Error("Voting is not currently open.");
  }

  if (!entry) {
    throw new Error("That project could not be found.");
  }

  const normalizedJudgeEmail = normalizeEmail(judgeEmail);
  const isBlocked = entry.teamEmails.some(
    (teamMember) => normalizeEmail(teamMember.email) === normalizedJudgeEmail
  );

  if (isBlocked) {
    throw new Error("Team members cannot vote on their own project.");
  }

  await prisma.vote.upsert({
    where: {
      entryId_judgeEmail: {
        entryId,
        judgeEmail: normalizedJudgeEmail
      }
    },
    update: {
      score,
      judgeUserId
    },
    create: {
      entryId,
      judgeEmail: normalizedJudgeEmail,
      judgeUserId,
      score
    }
  });

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

  await prisma.competitionState.update({
    where: { id: COMPETITION_STATE_ID },
    data: {
      votingStatus: "FINALIZED",
      finalizedAt: new Date()
    }
  });

  safeRevalidateHome();
}

export async function getCompetitionStatus() {
  const state = await ensureCompetitionState();
  return state.votingStatus;
}

export function isVotingOpen(status: VotingStatus) {
  return status === "OPEN";
}
