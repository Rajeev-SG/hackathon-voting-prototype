import { normalizeEmail } from "@/lib/auth";
import { MANAGER_EMAIL, type VotingStatus } from "@/lib/constants";

export type EntryRecordForLogic = {
  id: string;
  slug: string;
  projectName: string;
  teamName: string | null;
  summary: string | null;
  teamEmails: { email: string }[];
  votes: {
    judgeEmail: string;
    score: number;
    updatedAt: Date;
  }[];
};

export type ViewerIdentity = {
  clerkUserId: string | null;
  email: string | null;
  isAuthenticated: boolean;
  isManager: boolean;
};

export type ScoreboardEntryView = {
  id: string;
  slug: string;
  projectName: string;
  teamName: string | null;
  summary: string | null;
  rank: number;
  totalScore: number;
  averageScore: number | null;
  voteCount: number;
  teamEmails: string[];
  judgeEmails: string[];
  isSelfVoteBlocked: boolean;
  currentUserVote: number | null;
  canVote: boolean;
  lastVoteAt: string | null;
};

export type ProgressSummary = {
  percentage: number;
  castVotes: number;
  expectedVotes: number;
  participatingJudgeCount: number;
  entryCount: number;
  isComplete: boolean;
  helperText: string;
};

export type CompetitionSnapshot = {
  status: VotingStatus;
  startedAt: string | null;
  finalizedAt: string | null;
  managerEmail: string;
  viewer: ViewerIdentity;
  entries: ScoreboardEntryView[];
  progress: ProgressSummary;
  canDownloadTemplate: boolean;
  canUploadSheet: boolean;
  canBeginVoting: boolean;
  canFinalize: boolean;
  canResetRound: boolean;
  canDownloadFinalizedExport: boolean;
};

export function slugifyProjectName(projectName: string) {
  return projectName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isSelfVoteBlocked(entryEmails: string[], judgeEmail: string | null) {
  if (!judgeEmail) return false;
  const normalizedJudgeEmail = normalizeEmail(judgeEmail);
  return entryEmails.some((email) => normalizeEmail(email) === normalizedJudgeEmail);
}

export function deriveProgress({
  status,
  entries
}: {
  status: VotingStatus;
  entries: Pick<EntryRecordForLogic, "teamEmails" | "votes">[];
}): ProgressSummary {
  const entryCount = entries.length;
  const votes = entries.flatMap((entry) => entry.votes);

  if (!entryCount) {
    return {
      percentage: 0,
      castVotes: 0,
      expectedVotes: 0,
      participatingJudgeCount: 0,
      entryCount: 0,
      isComplete: false,
      helperText: "Upload a workbook to populate the public scoreboard."
    };
  }

  if (status === "PREPARING") {
    return {
      percentage: 0,
      castVotes: 0,
      expectedVotes: entryCount,
      participatingJudgeCount: 0,
      entryCount,
      isComplete: false,
      helperText: "Voting has not started yet. The manager can review the upload and begin judging when ready."
    };
  }

  const participatingJudgeEmails = Array.from(
    new Set(votes.map((vote) => normalizeEmail(vote.judgeEmail)))
  );
  const participatingJudgeCount = participatingJudgeEmails.length;
  const castVotes = votes.length;
  const expectedVotes = participatingJudgeEmails.reduce((sum, judgeEmail) => {
    const eligibleEntryCount = entries.filter(
      (entry) => !isSelfVoteBlocked(entry.teamEmails.map((teamMember) => teamMember.email), judgeEmail)
    ).length;

    return sum + eligibleEntryCount;
  }, 0);
  const percentage = expectedVotes === 0 ? 0 : Math.round((castVotes / expectedVotes) * 100);
  const isComplete =
    expectedVotes > 0 &&
    participatingJudgeEmails.every((judgeEmail) =>
      entries.every((entry) => {
        const entryEmails = entry.teamEmails.map((teamMember) => teamMember.email);
        if (isSelfVoteBlocked(entryEmails, judgeEmail)) {
          return true;
        }

        return entry.votes.some((vote) => normalizeEmail(vote.judgeEmail) === judgeEmail);
      })
    );

  if (status === "FINALIZED") {
    return {
      percentage: 100,
      castVotes,
      expectedVotes,
      participatingJudgeCount,
      entryCount,
      isComplete: true,
      helperText: "Judging is finalized. Public scores are locked and export is available to the manager."
    };
  }

  if (participatingJudgeCount === 0) {
    return {
      percentage: 0,
      castVotes,
      expectedVotes: entryCount,
      participatingJudgeCount: 0,
      entryCount,
      isComplete: false,
      helperText:
        "Voting is open. Judges join the completion count when they cast their first score, and completion means every participating judge has scored every project they are eligible to judge."
    };
  }

  return {
    percentage,
    castVotes,
    expectedVotes,
    participatingJudgeCount,
    entryCount,
    isComplete,
    helperText: isComplete
      ? "Every participating judge has scored every project they are eligible to judge. The manager can finalize the results."
      : "Completion is measured as every participating judge covering every project they are eligible to judge. Self-vote exclusions are removed from the denominator automatically."
  };
}

export function deriveCompetitionSnapshot({
  status,
  startedAt,
  finalizedAt,
  entries,
  viewer
}: {
  status: VotingStatus;
  startedAt: Date | null;
  finalizedAt: Date | null;
  entries: EntryRecordForLogic[];
  viewer: ViewerIdentity;
}): CompetitionSnapshot {
  const progress = deriveProgress({
    status,
    entries
  });

  const rankedEntries = entries
    .map((entry) => {
      const totalScore = entry.votes.reduce((sum, vote) => sum + vote.score, 0);
      const voteCount = entry.votes.length;
      const teamEmails = entry.teamEmails.map((member) => normalizeEmail(member.email));
      const currentUserVote =
        viewer.email == null
          ? null
          : entry.votes.find((vote) => normalizeEmail(vote.judgeEmail) === viewer.email)?.score ?? null;

      return {
        ...entry,
        totalScore,
        voteCount,
        averageScore: voteCount > 0 ? Number((totalScore / voteCount).toFixed(2)) : null,
        teamEmails,
        judgeEmails: Array.from(new Set(entry.votes.map((vote) => normalizeEmail(vote.judgeEmail)))),
        isSelfVoteBlocked: isSelfVoteBlocked(teamEmails, viewer.email),
        currentUserVote,
        lastVoteAt: entry.votes
          .reduce<Date | null>((latest, vote) => {
            if (!latest || vote.updatedAt > latest) return vote.updatedAt;
            return latest;
          }, null)
          ?.toISOString() ?? null
      };
    })
    .sort((left, right) => {
      if (right.totalScore !== left.totalScore) return right.totalScore - left.totalScore;
      if (right.voteCount !== left.voteCount) return right.voteCount - left.voteCount;
      return left.projectName.localeCompare(right.projectName);
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
      canVote:
        status === "OPEN" &&
        viewer.isAuthenticated &&
        !entry.isSelfVoteBlocked &&
        Boolean(viewer.email)
    }));

  return {
    status,
    startedAt: startedAt?.toISOString() ?? null,
    finalizedAt: finalizedAt?.toISOString() ?? null,
    managerEmail: MANAGER_EMAIL,
    viewer,
    entries: rankedEntries,
    progress,
    canDownloadTemplate: viewer.isManager,
    canUploadSheet: viewer.isManager && status === "PREPARING",
    canBeginVoting: viewer.isManager && status === "PREPARING" && entries.length > 0,
    canFinalize: viewer.isManager && status === "OPEN" && progress.isComplete,
    canResetRound: viewer.isManager && (entries.length > 0 || status !== "PREPARING"),
    canDownloadFinalizedExport: viewer.isManager && status === "FINALIZED"
  };
}
