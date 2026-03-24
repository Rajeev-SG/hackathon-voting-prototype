"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  Sparkles
} from "lucide-react";
import * as React from "react";

import { JudgeAuthPanel } from "@/components/judge-auth-panel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

  async function submitVote() {
    if (!entry || !selectedScore) return;
    setState("submitting");
    setErrorMessage(null);

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
      onVoteSaved();
      window.setTimeout(() => onOpenChange(false), 1500);
    } catch (error) {
      setState("error");
      setErrorMessage(error instanceof Error ? error.message : "We could not save that vote.");
    }
  }

  if (!entry) return null;

  const isLocked = status !== "OPEN";
  const needsAuth = !viewer.isAuthenticated;
  const isBlocked = entry.isSelfVoteBlocked;
  const hasRecordedVote = entry.currentUserVote != null;
  const previewScore = Number(selectedScore || String(entry.currentUserVote ?? 7));
  const preview = describeScore(previewScore);
  const recordedVote = entry.currentUserVote == null ? null : describeScore(entry.currentUserVote);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,70rem)] overflow-hidden border-border/90 p-0">
        <div className="grid max-h-[94vh] overflow-y-auto lg:grid-cols-[1.08fr_0.92fr]">
          <div className="shell-surface content-grid relative border-b border-border p-5 md:p-7 lg:border-b-0 lg:border-r lg:p-8">
            <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,var(--hero-glow),transparent_72%)]" />
            <DialogHeader className="relative">
              <div className="eyebrow">Judge vote</div>
              <DialogTitle className="max-w-2xl text-[clamp(2.15rem,4vw,3.4rem)] leading-[0.95]">
                {entry.projectName}
              </DialogTitle>
              <DialogDescription className="max-w-xl text-[0.95rem] leading-8">
                {entry.summary ??
                  "Capture the energy of the project in one clear score from 0 to 10. Judges get one shot per project, so the interaction should feel decisive and obvious."}
              </DialogDescription>
            </DialogHeader>

            <div className="relative mt-6 space-y-4">
              <div className="glass-panel rounded-[1.9rem] p-5">
                <div className="flex flex-wrap items-center gap-2">
                  {entry.teamName ? (
                    <span className="rounded-full bg-radix-gray-a-3 px-3 py-1 text-xs font-semibold text-muted-foreground">
                      {entry.teamName}
                    </span>
                  ) : null}
                  <span className="rounded-full bg-radix-teal-a-3 px-3 py-1 text-xs font-semibold text-accent-foreground">
                    {entry.voteCount} submitted vote{entry.voteCount === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-[0.95fr_1.05fr]">
                  <div className="rounded-[1.6rem] border border-border/80 bg-[rgb(255_255_255_/_0.03)] p-5">
                    <div className="eyebrow">Live aggregate</div>
                    <div
                      className="mt-3 font-display text-6xl font-black text-primary"
                      data-testid="vote-dialog-aggregate-total"
                    >
                      {entry.totalScore}
                    </div>
                    <div
                      className="mt-3 text-sm font-medium text-muted-foreground"
                      data-testid="vote-dialog-aggregate-summary"
                    >
                      {entry.averageScore == null
                        ? "No average yet"
                        : `${entry.averageScore} average across ${entry.voteCount} vote${entry.voteCount === 1 ? "" : "s"}`}
                    </div>
                  </div>

                  <div className="rounded-[1.6rem] border border-border/80 bg-[rgb(255_255_255_/_0.03)] p-5">
                    <div className="eyebrow">Judging stance</div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
                      <span className="rounded-full bg-radix-gray-a-3 px-3 py-2 text-muted-foreground">
                        0-3 Stretch
                      </span>
                      <span className="rounded-full bg-radix-purple-a-4 px-3 py-2 text-foreground">
                        4-7 Strong
                      </span>
                      <span className="rounded-full bg-radix-teal-a-4 px-3 py-2 text-accent-foreground">
                        8-10 Winner
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">
                      Choose the number that best captures your conviction. Once you submit, that vote locks immediately for the rest of the round.
                    </p>
                  </div>
                </div>
              </div>

              {hasRecordedVote ? (
                <div className="rounded-[1.7rem] border border-radix-teal-a-6 bg-radix-teal-a-3 p-5 text-accent-foreground">
                  <div className="flex flex-wrap items-center gap-3">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm font-semibold uppercase tracking-[0.2em]">Recorded score</span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-end gap-4">
                    <div className="font-display text-5xl font-black">{entry.currentUserVote}</div>
                    <div className="pb-2 text-sm font-medium">
                      <div>{recordedVote?.band}</div>
                      <div>{recordedVote?.summary}</div>
                    </div>
                  </div>
                </div>
              ) : null}

              {isBlocked ? (
                <div className="rounded-[1.6rem] border border-[rgb(217_140_20_/_0.28)] bg-[rgb(217_140_20_/_0.08)] p-5 text-sm leading-7 text-foreground">
                  Self-voting is blocked automatically because your signed-in email matches a submitted team email for this project.
                </div>
              ) : null}

              {errorMessage ? (
                <div
                  aria-live="polite"
                  className="rounded-[1.6rem] border border-[rgb(204_63_79_/_0.25)] bg-[rgb(204_63_79_/_0.08)] p-4 text-sm text-foreground"
                >
                  {errorMessage}
                </div>
              ) : null}
            </div>
          </div>

          <div className="relative p-5 md:p-7 lg:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--hero-glow),transparent_55%)]" />
            <div className="relative flex h-full flex-col">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>The score pad is fully keyboard friendly and optimized for quick judging.</span>
              </div>

              {isLocked ? (
                <div className="glass-panel flex flex-1 flex-col justify-center rounded-[1.9rem] p-6 sm:p-7">
                  <h3 className="font-display text-3xl font-black">
                    {status === "PREPARING" ? "Voting opens soon" : "Judging is finalized"}
                  </h3>
                  <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">
                    {status === "PREPARING"
                      ? "The board is visible already, but the manager has not opened the round yet."
                      : "Finalized results are locked now. Thanks for helping judge the field."}
                  </p>
                </div>
              ) : needsAuth ? (
                <div className="glass-panel flex flex-1 flex-col justify-between rounded-[1.9rem] p-6 sm:p-7">
                  <JudgeAuthPanel
                    afterAuthenticate={() => {
                      onVoteSaved();
                    }}
                    description="The board stays public, but signing in unlocks a single decisive score per project. Once you submit, that score is locked for the round."
                    title="Sign in to cast your vote"
                  />
                </div>
              ) : isBlocked ? (
                <div className="glass-panel flex flex-1 flex-col justify-center rounded-[1.9rem] p-6 sm:p-7">
                  <h3 className="font-display text-3xl font-black">You can’t score this one</h3>
                  <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">
                    We block self-voting automatically so judges never need to second-guess whether a score is allowed.
                  </p>
                </div>
              ) : hasRecordedVote ? (
                <div className="glass-panel flex flex-1 flex-col justify-between rounded-[1.9rem] p-6 sm:p-7">
                  <div>
                    <div className="eyebrow">Vote locked</div>
                    <h3 className="mt-2 font-display text-3xl font-black">Score recorded</h3>
                    <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">
                      Each judge gets one vote per project in this round. Your score is already on the board and cannot be changed now.
                    </p>
                  </div>

                  <div className="mt-6 rounded-[1.7rem] border border-border/80 bg-[rgb(255_255_255_/_0.03)] p-5">
                    <div className="flex items-center gap-3">
                      <LockKeyhole className="h-5 w-5 text-primary" />
                      <span className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Your submitted score
                      </span>
                    </div>
                    <div className="mt-4 flex items-end gap-4">
                      <div className="font-display text-6xl font-black text-foreground">{entry.currentUserVote}</div>
                      <div className="pb-2 text-sm text-muted-foreground">
                        <div className="font-semibold text-foreground">{recordedVote?.band}</div>
                        <div>{recordedVote?.summary}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-panel flex flex-1 flex-col rounded-[1.9rem] p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="eyebrow">Cast your only vote</div>
                      <h3 className="mt-2 font-display text-3xl font-black">Make it count</h3>
                    </div>
                    <div className="inline-flex items-center rounded-full bg-radix-gray-a-3 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      No edits after submit
                    </div>
                  </div>

                  <div className="mt-5 rounded-[1.6rem] border border-border/80 bg-[rgb(255_255_255_/_0.03)] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Selected score
                        </div>
                        <div className="mt-3 flex items-end gap-4">
                          <div className="font-display text-6xl font-black text-primary">{previewScore}</div>
                          <div className="pb-2">
                            <div className="text-lg font-semibold text-foreground">{preview.band}</div>
                            <div className="max-w-xs text-sm leading-7 text-muted-foreground">
                              {preview.summary}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div
                        className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${preview.accentClassName}`}
                      >
                        {preview.band}
                      </div>
                    </div>
                  </div>

                  <RadioGroup
                    className="mt-5 grid grid-cols-4 gap-2.5 sm:grid-cols-4 lg:grid-cols-4"
                    value={selectedScore}
                    onValueChange={setSelectedScore}
                  >
                    {scoreOptions.map((value) => {
                      const tone = describeScore(value);

                      return (
                        <RadioGroupItem
                          aria-label={`Score ${value}, ${tone.band}`}
                          autoFocus={value === 7}
                          key={value}
                          value={String(value)}
                          className="group relative flex aspect-[0.98] min-h-[72px] flex-col items-start justify-between overflow-hidden rounded-[1.55rem] border-border/80 bg-[rgb(255_255_255_/_0.03)] p-3.5 text-left hover:-translate-y-0.5 data-[state=checked]:shadow-[0_18px_50px_var(--shadow-soft)] sm:min-h-[84px]"
                          data-testid={`score-option-${value}`}
                        >
                          <span className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-radix-teal-a-6 to-transparent opacity-0 transition group-data-[state=checked]:opacity-100" />
                          <span className="font-display text-[2rem] font-black leading-none sm:text-[2.15rem]">{value}</span>
                          <span className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground group-data-[state=checked]:text-accent-foreground">
                            {tone.band}
                          </span>
                        </RadioGroupItem>
                      );
                    })}
                  </RadioGroup>

                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    Tab into the score grid, then use arrow keys and press space or enter to choose.
                  </p>

                  <div className="mt-auto pt-5">
                    <AnimatePresence mode="wait">
                      {state === "success" ? (
                        <motion.div
                          key="vote-success"
                          animate={{ opacity: 1, y: 0 }}
                          aria-live="polite"
                          className="rounded-[1.7rem] border border-radix-teal-a-6 bg-radix-teal-a-3 p-4 text-accent-foreground shadow-halo"
                          data-testid="vote-saved-toast"
                          exit={{ opacity: 0, y: 10 }}
                          initial={{ opacity: 0, y: 14 }}
                          role="status"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1 rounded-full bg-[rgb(255_255_255_/_0.14)] p-2">
                              <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold uppercase tracking-[0.18em]">
                                Vote locked in
                              </div>
                              <div className="mt-2 font-display text-2xl font-black">
                                {previewScore} points recorded
                              </div>
                              <div className="mt-2 text-sm leading-7">
                                Your score is live on the board now. This project is locked for the rest of the round.
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="vote-cta"
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-[1.7rem] border border-border/80 bg-[rgb(255_255_255_/_0.03)] p-4"
                          exit={{ opacity: 0, y: 10 }}
                          initial={{ opacity: 0, y: 14 }}
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                Ready to submit
                              </div>
                              <div className="mt-2 text-sm leading-7 text-muted-foreground">
                                You are about to lock{" "}
                                <span className="font-semibold text-foreground">{previewScore}</span> for this project.
                              </div>
                            </div>
                            <Button
                              className="min-w-[220px] justify-center"
                              data-testid="submit-vote"
                              disabled={!selectedScore || state === "submitting"}
                              onClick={submitVote}
                              size="lg"
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
