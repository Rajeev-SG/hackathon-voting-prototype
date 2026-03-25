import { normalizeEmail } from "@/lib/auth";
import { MANAGER_EMAIL, type VotingStatus } from "@/lib/constants";

export type EntryRecordForLogic = {
  id: string;
  slug: string;
  projectName: string;
  teamName: string | null;
  summary: string | null;
  isVotingOpen: boolean;
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
  isVotingOpen: boolean;
  isSelfVoteBlocked: boolean;
  currentUserVote: number | null;
  canVote: boolean;
  lastVoteAt: string | null;
  outstandingJudgeEmails: string[];
  outstandingJudgeCount: number;
};

export type ProgressSummary = {
  percentage: number;
  castVotes: number;
  expectedVotes: number;
  participatingJudgeCount: number;
  entryCount: number;
  openEntryCount: number;
  isComplete: boolean;
  helperText: string;
};

export type JudgeCoverageSummary = {
  judgeEmail: string;
  eligibleOpenEntries: number;
  completedOpenEntries: number;
  remainingOpenEntries: number;
  remainingProjectNames: string[];
  lastActivityAt: string | null;
};

export type ManagerRoundTracker = {
  totalRemainingVotes: number;
  judgesStillOutstanding: number;
  judges: JudgeCoverageSummary[];
  helperText: string;
};

function getParticipatingJudgeEmails(entries: Pick<EntryRecordForLogic, "votes">[]) {
  return Array.from(
    new Set(entries.flatMap((entry) => entry.votes.map((vote) => normalizeEmail(vote.judgeEmail))))
  );
}

function getEligibleJudgeEmailsForEntry(
  entry: Pick<EntryRecordForLogic, "teamEmails" | "votes">,
  participatingJudgeEmails: string[]
) {
  const entryEmails = entry.teamEmails.map((teamMember) => teamMember.email);
  return participatingJudgeEmails.filter((judgeEmail) => !isSelfVoteBlocked(entryEmails, judgeEmail));
}

function getOutstandingJudgeEmailsForEntry(
  entry: Pick<EntryRecordForLogic, "teamEmails" | "votes">,
  participatingJudgeEmails: string[]
) {
  const judgesWhoAlreadyVoted = new Set(entry.votes.map((vote) => normalizeEmail(vote.judgeEmail)));

  return getEligibleJudgeEmailsForEntry(entry, participatingJudgeEmails).filter(
    (judgeEmail) => !judgesWhoAlreadyVoted.has(judgeEmail)
  );
}

export type CompetitionSnapshot = {
  status: VotingStatus;
  startedAt: string | null;
  finalizedAt: string | null;
  managerEmail: string;
  viewer: ViewerIdentity;
  entries: ScoreboardEntryView[];
  progress: ProgressSummary;
  managerTracker: ManagerRoundTracker;
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
  entries: Pick<EntryRecordForLogic, "teamEmails" | "votes" | "isVotingOpen">[];
}): ProgressSummary {
  const entryCount = entries.length;
  const openEntries = entries.filter((entry) => entry.isVotingOpen);
  const openEntryCount = openEntries.length;
  const votes = entries.flatMap((entry) => entry.votes);
  const openVotes = openEntries.flatMap((entry) => entry.votes);
  const hasAnyVotes = votes.length > 0;

  if (!entryCount) {
    return {
      percentage: 0,
      castVotes: 0,
      expectedVotes: 0,
      participatingJudgeCount: 0,
      entryCount: 0,
      openEntryCount: 0,
      isComplete: false,
      helperText: "Upload a workbook to populate the public scoreboard."
    };
  }

  if (status === "PREPARING") {
    return {
      percentage: 0,
      castVotes: 0,
      expectedVotes: openEntryCount,
      participatingJudgeCount: 0,
      entryCount,
      openEntryCount,
      isComplete: false,
      helperText:
        openEntryCount > 0
          ? "Voting has not started yet. The manager can review the upload, close any project that should stay out of the round, and begin judging when ready."
          : "Every project is currently closed to new votes. Reopen at least one entry before judging starts."
    };
  }

  if (openEntryCount === 0) {
    return {
      percentage: hasAnyVotes ? 100 : 0,
      castVotes: 0,
      expectedVotes: 0,
      participatingJudgeCount: 0,
      entryCount,
      openEntryCount,
      isComplete: hasAnyVotes,
      helperText: hasAnyVotes
        ? "No projects are currently open for new votes. Reopen an entry to keep judging, or finalize if the round is done."
        : "No projects are currently open for voting. Reopen at least one entry to let judges score."
    };
  }

  const participatingJudgeEmails = getParticipatingJudgeEmails(openEntries);
  const participatingJudgeCount = participatingJudgeEmails.length;
  const castVotes = openVotes.length;
  const outstandingJudgeEmailsByEntry = openEntries.map((entry) =>
    getOutstandingJudgeEmailsForEntry(entry, participatingJudgeEmails)
  );
  const expectedVotes = openEntries.reduce(
    (sum, entry) => sum + getEligibleJudgeEmailsForEntry(entry, participatingJudgeEmails).length,
    0
  );
  const percentage = expectedVotes === 0 ? 0 : Math.round((castVotes / expectedVotes) * 100);
  const isComplete = expectedVotes > 0 && outstandingJudgeEmailsByEntry.every((emails) => emails.length === 0);

  if (status === "FINALIZED") {
    return {
      percentage: 100,
      castVotes: votes.length,
      expectedVotes,
      participatingJudgeCount,
      entryCount,
      openEntryCount,
      isComplete: true,
      helperText: "Judging is finalized. Public scores are locked and export is available to the manager."
    };
  }

  if (participatingJudgeCount === 0) {
    return {
      percentage: 0,
      castVotes,
      expectedVotes: openEntryCount,
      participatingJudgeCount: 0,
      entryCount,
      openEntryCount,
      isComplete: false,
      helperText:
        "Voting is open. Judges join the completion count when they cast their first score, and completion means every participating judge has covered every project that is still open for them."
    };
  }

  return {
    percentage,
    castVotes,
    expectedVotes,
    participatingJudgeCount,
    entryCount,
    openEntryCount,
    isComplete,
    helperText: isComplete
      ? "Every participating judge has scored every project that is still open for them. The manager can finalize the results."
      : "Completion is measured across projects that are still open for voting. Closed projects stay on the board but drop out of the denominator automatically."
  };
}

export function deriveManagerRoundTracker({
  status,
  entries
}: {
  status: VotingStatus;
  entries: EntryRecordForLogic[];
}): ManagerRoundTracker {
  const openEntries = entries.filter((entry) => entry.isVotingOpen);
  const participatingJudgeEmails = getParticipatingJudgeEmails(openEntries);

  if (status !== "OPEN") {
    return {
      totalRemainingVotes: 0,
      judgesStillOutstanding: 0,
      judges: [],
      helperText:
        status === "PREPARING"
          ? "Judges appear here after the round opens and they cast their first score."
          : "Judging is finalized. Every remaining-vote obligation is already resolved."
    };
  }

  if (participatingJudgeEmails.length === 0) {
    return {
      totalRemainingVotes: 0,
      judgesStillOutstanding: 0,
      judges: [],
      helperText:
        "No judge has cast a vote yet. As soon as the first score arrives, this tracker will show who still has work left."
    };
  }

  const judges = participatingJudgeEmails
    .map((judgeEmail) => {
      const eligibleOpenEntries = openEntries.filter((entry) =>
        getEligibleJudgeEmailsForEntry(entry, participatingJudgeEmails).includes(judgeEmail)
      );
      const completedOpenEntries = eligibleOpenEntries.filter((entry) =>
        entry.votes.some((vote) => normalizeEmail(vote.judgeEmail) === judgeEmail)
      );
      const remainingEntries = eligibleOpenEntries.filter((entry) =>
        entry.votes.every((vote) => normalizeEmail(vote.judgeEmail) !== judgeEmail)
      );
      const lastActivity = openEntries
        .flatMap((entry) =>
          entry.votes
            .filter((vote) => normalizeEmail(vote.judgeEmail) === judgeEmail)
            .map((vote) => vote.updatedAt)
        )
        .sort((left, right) => right.getTime() - left.getTime())[0];

      return {
        judgeEmail,
        eligibleOpenEntries: eligibleOpenEntries.length,
        completedOpenEntries: completedOpenEntries.length,
        remainingOpenEntries: remainingEntries.length,
        remainingProjectNames: remainingEntries.map((entry) => entry.projectName),
        lastActivityAt: lastActivity?.toISOString() ?? null
      };
    })
    .sort((left, right) => {
      if (right.remainingOpenEntries !== left.remainingOpenEntries) {
        return right.remainingOpenEntries - left.remainingOpenEntries;
      }

      return left.judgeEmail.localeCompare(right.judgeEmail);
    });

  const totalRemainingVotes = judges.reduce((sum, judge) => sum + judge.remainingOpenEntries, 0);
  const judgesStillOutstanding = judges.filter((judge) => judge.remainingOpenEntries > 0).length;

  return {
    totalRemainingVotes,
    judgesStillOutstanding,
    judges,
    helperText:
      "Uses the same open-project and self-vote rules as finalization, so this is the trustworthy list of what is still outstanding."
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
  const managerTracker = deriveManagerRoundTracker({
    status,
    entries
  });
  const participatingJudgeEmails = getParticipatingJudgeEmails(entries.filter((entry) => entry.isVotingOpen));

  const rankedEntries = entries
    .map((entry) => {
      const totalScore = entry.votes.reduce((sum, vote) => sum + vote.score, 0);
      const voteCount = entry.votes.length;
      const teamEmails = entry.teamEmails.map((member) => normalizeEmail(member.email));
      const currentUserVote =
        viewer.email == null
          ? null
          : entry.votes.find((vote) => normalizeEmail(vote.judgeEmail) === viewer.email)?.score ?? null;
      const outstandingJudgeEmails =
        status === "OPEN"
          ? getOutstandingJudgeEmailsForEntry(entry, participatingJudgeEmails)
          : [];

      return {
        ...entry,
        totalScore,
        voteCount,
        averageScore: voteCount > 0 ? Number((totalScore / voteCount).toFixed(2)) : null,
        teamEmails,
        judgeEmails: Array.from(new Set(entry.votes.map((vote) => normalizeEmail(vote.judgeEmail)))),
        isVotingOpen: entry.isVotingOpen,
        isSelfVoteBlocked: isSelfVoteBlocked(teamEmails, viewer.email),
        currentUserVote,
        outstandingJudgeEmails,
        outstandingJudgeCount: outstandingJudgeEmails.length,
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
        entry.isVotingOpen &&
        viewer.isAuthenticated &&
        !entry.isSelfVoteBlocked &&
        entry.currentUserVote == null &&
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
    managerTracker,
    canDownloadTemplate: viewer.isManager,
    canUploadSheet: viewer.isManager && status === "PREPARING",
    canBeginVoting: viewer.isManager && status === "PREPARING" && entries.some((entry) => entry.isVotingOpen),
    canFinalize: viewer.isManager && status === "OPEN" && progress.isComplete,
    canResetRound: viewer.isManager && (entries.length > 0 || status !== "PREPARING"),
    canDownloadFinalizedExport: viewer.isManager && status === "FINALIZED"
  };
}
