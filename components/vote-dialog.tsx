"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckCircle2, LockKeyhole } from "lucide-react";
import * as React from "react";

import { JudgeAuthPanel } from "@/components/judge-auth-panel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { pushDataLayerEvent } from "@/lib/analytics";
import type { ScoreboardEntryView, ViewerIdentity } from "@/lib/competition-logic";

type VoteDialogProps = {
  entry: ScoreboardEntryView | null;
  open: boolean;
  status: "PREPARING" | "OPEN" | "FINALIZED";
  viewer: ViewerIdentity;
  onOpenChange: (open: boolean) => void;
  onVoteSaved: () => void;
};

const scoreOptions = Array.from({ length: 11 }, (_, value) => value);

function describeScore(score: number) {
  if (score <= 3) {
    return {
      band: "Stretch",
      summary: "Interesting spark, but still early and unproven.",
      accentClassName: "bg-radix-gray-a-3 text-muted-foreground"
    };
  }

  if (score <= 7) {
    return {
      band: "Strong",
      summary: "Solid execution with clear promise and momentum.",
      accentClassName: "bg-radix-purple-a-4 text-foreground"
    };
  }

  return {
    band: "Winner",
    summary: "A standout project you would confidently champion.",
    accentClassName: "bg-radix-teal-a-4 text-accent-foreground"
  };
}

export function VoteDialog({
  entry,
  open,
  status,
  viewer,
  onOpenChange,
  onVoteSaved
}: VoteDialogProps) {
  const [selectedScore, setSelectedScore] = React.useState<string>("7");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [state, setState] = React.useState<"idle" | "submitting" | "success" | "error">("idle");

  React.useEffect(() => {
    if (!entry || !open) return;
    setSelectedScore(entry.currentUserVote == null ? "7" : String(entry.currentUserVote));
    setErrorMessage(null);
    setState("idle");
  }, [entry?.id, open]);

  React.useEffect(() => {
    if (!entry || !open) return;

    pushDataLayerEvent("vote_dialog_viewed", {
      entry_slug: entry.slug,
      entry_name: entry.projectName,
      vote_count: entry.voteCount,
      aggregate_score: entry.totalScore,
      competition_status: status.toLowerCase(),
      viewer_role: viewer.isManager ? "manager" : viewer.isAuthenticated ? "judge" : "public",
      viewer_can_vote: entry.canVote,
      viewer_has_vote: entry.currentUserVote != null,
      entry_voting_open: entry.isVotingOpen
    });
  }, [entry, open, status, viewer.isAuthenticated, viewer.isManager]);

  function handleScoreChange(nextScore: string) {
    setSelectedScore(nextScore);
    pushDataLayerEvent("vote_score_selected", {
      entry_slug: entry?.slug,
      score: Number(nextScore),
      viewer_role: viewer.isManager ? "manager" : viewer.isAuthenticated ? "judge" : "public"
    });
  }

  async function submitVote() {
    if (!entry || !selectedScore) return;
    setState("submitting");
    setErrorMessage(null);
    pushDataLayerEvent("vote_submit_started", {
      entry_slug: entry.slug,
      entry_name: entry.projectName,
      score: Number(selectedScore)
    });

    try {
      const response = await fetch("/api/votes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          entryId: entry.id,
          score: Number(selectedScore)
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error ?? "We could not save that vote.");
      }

      setState("success");
      pushDataLayerEvent("vote_submitted", {
        entry_slug: entry.slug,
        entry_name: entry.projectName,
        score: Number(selectedScore)
      });
      onVoteSaved();
      window.setTimeout(() => onOpenChange(false), 1500);
    } catch (error) {
      setState("error");
      pushDataLayerEvent("vote_submit_failed", {
        entry_slug: entry.slug,
        score: Number(selectedScore)
      });
      setErrorMessage(error instanceof Error ? error.message : "We could not save that vote.");
    }
  }

  if (!entry) return null;

  const isLocked = status !== "OPEN";
  const needsAuth = !viewer.isAuthenticated;
  const isBlocked = entry.isSelfVoteBlocked;
  const hasRecordedVote = entry.currentUserVote != null;
  const isEntryClosed = !entry.isVotingOpen;
  const previewScore = Number(selectedScore || String(entry.currentUserVote ?? 7));
  const preview = describeScore(previewScore);
  const recordedVote = entry.currentUserVote == null ? null : describeScore(entry.currentUserVote);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(94vw,44rem)] overflow-hidden border-border/90 p-0">
        <div className="shell-surface relative max-h-[88vh] overflow-y-auto px-4 py-4 sm:px-5 sm:py-4">
          <div className="absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top_left,var(--hero-glow),transparent_72%)]" />
          <div className="relative space-y-3">
            <DialogHeader className="space-y-1.5">
              <div className="eyebrow">Judge vote</div>
              <DialogTitle className="max-w-3xl text-[clamp(1.5rem,2.7vw,2.1rem)] leading-[0.98]">
                {entry.projectName}
              </DialogTitle>
              {entry.summary ? (
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{entry.summary}</p>
              ) : null}
            </DialogHeader>

            <div className="rounded-[1.35rem] border border-border/80 bg-[rgb(255_255_255_/_0.03)] px-3.5 py-3">
              <div className="flex flex-wrap items-center gap-2">
                {entry.teamName ? (
                  <span className="rounded-full bg-radix-gray-a-3 px-3 py-1 text-xs font-semibold text-muted-foreground">
                    {entry.teamName}
                  </span>
                ) : null}
                <span className="rounded-full bg-radix-teal-a-3 px-3 py-1 text-xs font-semibold text-accent-foreground">
                  {entry.voteCount} submitted vote{entry.voteCount === 1 ? "" : "s"}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                    isEntryClosed ? "bg-radix-amber-a-3 text-foreground" : "bg-radix-gray-a-3 text-muted-foreground"
                  }`}
                >
                  {isEntryClosed ? "Voting paused" : "Voting active"}
                </span>
                <span className="rounded-full bg-radix-gray-a-3 px-3 py-1 text-xs font-semibold text-muted-foreground">
                  Total{" "}
                  <span className="font-display text-sm font-black text-foreground" data-testid="vote-dialog-aggregate-total">
                    {entry.totalScore}
                  </span>
                </span>
                <span
                  className="rounded-full bg-radix-gray-a-3 px-3 py-1 text-xs font-semibold text-muted-foreground"
                  data-testid="vote-dialog-aggregate-summary"
                >
                  {entry.averageScore == null
                    ? "No average yet"
                    : `${entry.averageScore} avg`}
                </span>
              </div>
            </div>

            {hasRecordedVote ? (
              <div className="rounded-[1.45rem] border border-radix-teal-a-6 bg-radix-teal-a-3 p-4 text-accent-foreground">
                <div className="flex flex-wrap items-center gap-3">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-semibold uppercase tracking-[0.18em]">Recorded score</span>
                </div>
                <div className="mt-3 flex flex-wrap items-end gap-4">
                  <div className="font-display text-4xl font-black sm:text-5xl">{entry.currentUserVote}</div>
                  <div className="pb-1 text-sm font-medium">
                    <div>{recordedVote?.band}</div>
                    <div>{recordedVote?.summary}</div>
                  </div>
                </div>
              </div>
            ) : null}

            {isBlocked ? (
              <div className="rounded-[1.4rem] border border-[rgb(217_140_20_/_0.28)] bg-[rgb(217_140_20_/_0.08)] p-4 text-sm leading-6 text-foreground">
                Self-voting is blocked automatically because your signed-in email matches a submitted team email for this project.
              </div>
            ) : null}

            {isEntryClosed && !hasRecordedVote && status === "OPEN" ? (
              <div className="rounded-[1.4rem] border border-[rgb(217_140_20_/_0.28)] bg-[rgb(217_140_20_/_0.08)] p-4 text-sm leading-6 text-foreground">
                Voting is paused for this project right now. The manager can reopen it from the scoreboard at any time.
              </div>
            ) : null}

            {errorMessage ? (
              <div
                aria-live="polite"
                className="rounded-[1.4rem] border border-[rgb(204_63_79_/_0.25)] bg-[rgb(204_63_79_/_0.08)] p-4 text-sm text-foreground"
              >
                {errorMessage}
              </div>
            ) : null}

            {isLocked ? (
              <div className="glass-panel rounded-[1.55rem] p-4 sm:p-5">
                <h3 className="font-display text-2xl font-black">
                  {status === "PREPARING" ? "Voting opens soon" : "Judging is finalized"}
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {status === "PREPARING"
                    ? "The board is visible already, but the manager has not opened the round yet."
                    : "Finalized results are locked now. Thanks for helping judge the field."}
                </p>
              </div>
            ) : hasRecordedVote ? (
              <div className="glass-panel rounded-[1.55rem] p-4 sm:p-5">
                <div className="eyebrow">Vote locked</div>
                <h3 className="mt-2 font-display text-2xl font-black">Score recorded</h3>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Each judge gets one vote per project in this round. Your score is already on the board and cannot be changed now.
                </p>
              </div>
            ) : isEntryClosed ? (
              <div className="glass-panel rounded-[1.55rem] p-4 sm:p-5">
                <h3 className="font-display text-2xl font-black">Voting is paused</h3>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  This project is still visible on the public board, but the manager has closed it to new votes for now.
                </p>
              </div>
            ) : needsAuth ? (
              <div className="glass-panel rounded-[1.55rem] p-4 sm:p-5">
                <JudgeAuthPanel
                  afterAuthenticate={() => {
                    onVoteSaved();
                  }}
                  description="The board stays public, but signing in unlocks a single decisive score per project. Once you submit, that score is locked for the round."
                  title="Sign in to cast your vote"
                />
              </div>
            ) : isBlocked ? (
              <div className="glass-panel rounded-[1.55rem] p-4 sm:p-5">
                <h3 className="font-display text-2xl font-black">You can’t score this one</h3>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  We block self-voting automatically so judges never need to second-guess whether a score is allowed.
                </p>
              </div>
            ) : (
              <div className="glass-panel rounded-[1.55rem] p-3.5 sm:p-4" data-testid="vote-dialog-fit-surface">
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="eyebrow">Cast your only vote</div>
                    <h3 className="mt-1.5 font-display text-[1.65rem] font-black sm:text-[1.85rem]">Make it count</h3>
                  </div>
                  <div className="inline-flex items-center rounded-full bg-radix-gray-a-3 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    No edits after submit
                  </div>
                </div>

                <div className="mt-3 rounded-[1.25rem] border border-border/80 bg-[rgb(255_255_255_/_0.03)] p-3">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Selected score
                      </div>
                      <div className="mt-1.5 flex items-end gap-3">
                        <div className="font-display text-4xl font-black text-primary sm:text-5xl">{previewScore}</div>
                        <div className="pb-0.5">
                          <div className="text-sm font-semibold text-foreground">{preview.band}</div>
                          <div className="max-w-[15rem] text-xs leading-5 text-muted-foreground">{preview.summary}</div>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] ${preview.accentClassName}`}
                    >
                      {preview.band}
                    </div>
                  </div>
                </div>

                <RadioGroup
                  className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6"
                  value={selectedScore}
                  onValueChange={handleScoreChange}
                >
                  {scoreOptions.map((value) => {
                    const tone = describeScore(value);

                    return (
                      <RadioGroupItem
                        aria-label={`Score ${value}, ${tone.band}`}
                        autoFocus={value === 7}
                        key={value}
                        value={String(value)}
                        className="group relative flex min-h-[54px] flex-col items-start justify-between overflow-hidden rounded-[1.05rem] border-border/80 bg-[rgb(255_255_255_/_0.03)] px-2.5 py-2 text-left hover:-translate-y-0.5 data-[state=checked]:shadow-[0_18px_50px_var(--shadow-soft)] sm:min-h-[58px]"
                        data-testid={`score-option-${value}`}
                      >
                        <span className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-radix-teal-a-6 to-transparent opacity-0 transition group-data-[state=checked]:opacity-100" />
                        <span className="font-display text-[1.35rem] font-black leading-none sm:text-[1.5rem]">{value}</span>
                        <span className="text-[0.52rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground group-data-[state=checked]:text-accent-foreground">
                          {tone.band}
                        </span>
                      </RadioGroupItem>
                    );
                  })}
                </RadioGroup>

                <div className="mt-3">
                  <AnimatePresence mode="wait">
                    {state === "success" ? (
                      <motion.div
                        key="vote-success"
                        animate={{ opacity: 1, y: 0 }}
                        aria-live="polite"
                        className="rounded-[1.25rem] border border-radix-teal-a-6 bg-radix-teal-a-3 p-3.5 text-accent-foreground shadow-halo"
                        data-testid="vote-saved-toast"
                        exit={{ opacity: 0, y: 10 }}
                        initial={{ opacity: 0, y: 14 }}
                        role="status"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-full bg-[rgb(255_255_255_/_0.14)] p-1.5">
                            <CheckCircle2 className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em]">
                              Vote locked in
                            </div>
                            <div className="mt-1 font-display text-xl font-black sm:text-2xl">
                              {previewScore} points recorded
                            </div>
                            <div className="mt-1 text-sm leading-5">
                              Your score is live on the board now. This project is locked for the rest of the round.
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="vote-cta"
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-[1.25rem] border border-border/80 bg-[rgb(255_255_255_/_0.03)] p-3.5"
                        exit={{ opacity: 0, y: 10 }}
                        initial={{ opacity: 0, y: 14 }}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <div className="text-sm leading-5 text-muted-foreground">
                              Lock{" "}
                              <span className="font-semibold text-foreground">{previewScore}</span> for this project.
                            </div>
                          </div>
                          <Button
                            className="min-w-[172px] justify-center"
                            data-testid="submit-vote"
                            disabled={!selectedScore || state === "submitting"}
                            onClick={submitVote}
                            size="sm"
                          >
                            {state === "submitting" ? (
                              "Locking vote..."
                            ) : (
                              <>
                                Lock score
                                <ArrowRight className="h-4 w-4" />
                              </>
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
