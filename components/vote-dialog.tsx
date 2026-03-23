"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import * as React from "react";

import { JudgeAuthPanel } from "@/components/judge-auth-panel";
import type { ScoreboardEntryView, ViewerIdentity } from "@/lib/competition-logic";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type VoteDialogProps = {
  entry: ScoreboardEntryView | null;
  open: boolean;
  status: "PREPARING" | "OPEN" | "FINALIZED";
  viewer: ViewerIdentity;
  onOpenChange: (open: boolean) => void;
  onVoteSaved: () => void;
};

export function VoteDialog({
  entry,
  open,
  status,
  viewer,
  onOpenChange,
  onVoteSaved
}: VoteDialogProps) {
  const [selectedScore, setSelectedScore] = React.useState<string>("");
  const [message, setMessage] = React.useState<string | null>(null);
  const [state, setState] = React.useState<"idle" | "submitting" | "success" | "error">("idle");

  React.useEffect(() => {
    if (!entry || !open) return;
    setSelectedScore(entry.currentUserVote == null ? "" : String(entry.currentUserVote));
    setMessage(null);
    setState("idle");
  }, [entry?.id, open]);

  async function submitVote() {
    if (!entry || !selectedScore) return;
    setState("submitting");
    setMessage(null);

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
      setMessage(entry.currentUserVote == null ? "Your score is live on the board." : "Your updated score is live.");
      onVoteSaved();
      window.setTimeout(() => onOpenChange(false), 1200);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "We could not save that vote.");
    }
  }

  if (!entry) return null;

  const isLocked = status !== "OPEN";
  const needsAuth = !viewer.isAuthenticated;
  const isBlocked = entry.isSelfVoteBlocked;
  const recommendedScore = selectedScore || String(Math.min(10, Math.max(7, entry.currentUserVote ?? 7)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0">
        <div className="grid max-h-[85vh] overflow-y-auto md:grid-cols-[1.05fr_0.95fr]">
          <div className="shell-surface content-grid relative border-b border-border p-6 md:border-b-0 md:border-r md:p-8">
            <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,var(--hero-glow),transparent_72%)]" />
            <DialogHeader className="relative">
              <div className="eyebrow">Judge Vote</div>
              <DialogTitle>{entry.projectName}</DialogTitle>
              <DialogDescription className="max-w-md">
                {entry.summary ??
                  "Capture the energy of the project in one clear score from 0 to 10. Judges can revise their score until the manager finalizes the round."}
              </DialogDescription>
            </DialogHeader>

            <div className="relative mt-8 space-y-5">
              <div className="glass-panel rounded-[1.75rem] p-5">
                <div className="flex flex-wrap gap-2">
                  {entry.track ? (
                    <span className="rounded-full bg-radix-teal-a-4 px-3 py-1 text-xs font-semibold text-accent-foreground">
                      {entry.track}
                    </span>
                  ) : null}
                  {entry.teamName ? (
                    <span className="rounded-full bg-radix-gray-a-3 px-3 py-1 text-xs font-semibold text-muted-foreground">
                      {entry.teamName}
                    </span>
                  ) : null}
                  {entry.booth ? (
                    <span className="rounded-full bg-radix-purple-a-4 px-3 py-1 text-xs font-semibold text-foreground">
                      {entry.booth}
                    </span>
                  ) : null}
                </div>
                <div className="mt-5 flex items-end gap-3">
                  <div className="font-display text-5xl font-black text-primary" data-testid="vote-dialog-aggregate-total">
                    {entry.totalScore}
                  </div>
                  <div
                    className="pb-2 text-sm font-medium text-muted-foreground"
                    data-testid="vote-dialog-aggregate-summary"
                  >
                    aggregate points
                    <div>{entry.voteCount} submitted vote{entry.voteCount === 1 ? "" : "s"}</div>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  {entry.demoUrl ? (
                    <>
                      Demo ready at <span className="font-medium text-foreground">{entry.demoUrl}</span>.
                    </>
                  ) : (
                    "Tap a score and submit. The public scoreboard updates right away with smooth rank changes."
                  )}
                </p>
              </div>

              {isBlocked ? (
                <div className="rounded-[1.5rem] border border-[rgb(217_140_20_/_0.28)] bg-[rgb(217_140_20_/_0.08)] p-5 text-sm leading-7 text-foreground">
                  Self-voting is blocked automatically because your signed-in email matches a submitted team email for this project.
                </div>
              ) : null}

              {message ? (
                <div
                  aria-live="polite"
                  className={`rounded-[1.5rem] border p-4 text-sm ${
                    state === "error"
                      ? "border-[rgb(204_63_79_/_0.25)] bg-[rgb(204_63_79_/_0.08)] text-foreground"
                      : "border-radix-teal-a-6 bg-radix-teal-a-3 text-accent-foreground"
                  }`}
                >
                  {message}
                </div>
              ) : null}
            </div>
          </div>

          <div className="relative p-6 md:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--hero-glow),transparent_55%)]" />
            <div className="relative flex h-full flex-col">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Choose one score from 0 to 10.</span>
              </div>

              {isLocked ? (
                <div className="glass-panel flex flex-1 flex-col justify-center rounded-[1.75rem] p-6">
                  <h3 className="font-display text-2xl font-black">
                    {status === "PREPARING" ? "Voting opens soon" : "Judging is finalized"}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {status === "PREPARING"
                      ? "The scoreboard is live, but the manager has not opened the round yet."
                      : "Finalized results are now locked. Thanks for judging."}
                  </p>
                </div>
              ) : needsAuth ? (
                <div className="glass-panel flex flex-1 flex-col justify-between rounded-[1.75rem] p-6">
                  <JudgeAuthPanel
                    afterAuthenticate={() => {
                      setMessage("You're signed in. Pick a score and send it.");
                      onVoteSaved();
                    }}
                    description="The board stays public, but signing in unlocks one forgiving score per project, with edits allowed until the manager finalizes the round."
                    title="Sign in and score this project"
                  />
                </div>
              ) : isBlocked ? (
                <div className="glass-panel flex flex-1 flex-col justify-center rounded-[1.75rem] p-6">
                  <h3 className="font-display text-2xl font-black">You can’t score this one</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    We block self-voting automatically to keep judging fair and friction-free for the manager.
                  </p>
                </div>
              ) : (
                <div className="glass-panel flex flex-1 flex-col rounded-[1.75rem] p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="eyebrow">Your score</div>
                      <h3 className="mt-2 font-display text-2xl font-black">
                        {entry.currentUserVote == null ? "Make it count" : "Adjust your call"}
                      </h3>
                    </div>
                    <div className="rounded-full bg-radix-gray-a-3 px-3 py-1 text-xs font-semibold text-muted-foreground">
                      {entry.currentUserVote == null ? "New score" : `Current: ${entry.currentUserVote}`}
                    </div>
                  </div>

                  <RadioGroup
                    className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4"
                    value={selectedScore}
                    onValueChange={setSelectedScore}
                  >
                    {Array.from({ length: 11 }, (_, value) => value).map((value) => (
                      <RadioGroupItem
                        aria-label={`Score ${value}`}
                        autoFocus={String(value) === recommendedScore}
                        key={value}
                        value={String(value)}
                        className="group flex h-20 flex-col items-center justify-center"
                        data-testid={`score-option-${value}`}
                      >
                        <span className="font-display text-3xl font-black">{value}</span>
                        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground group-data-[state=checked]:text-accent-foreground">
                          {value <= 3 ? "Stretch" : value <= 7 ? "Strong" : "Winner"}
                        </span>
                      </RadioGroupItem>
                    ))}
                  </RadioGroup>

                  <p className="mt-5 text-sm leading-7 text-muted-foreground">
                    Keyboard friendly: tab into the score grid, then use arrow keys to move across values and press space or enter to choose.
                  </p>

                  <div className="mt-auto pt-6">
                    <Button
                      className="w-full justify-center"
                      data-testid="submit-vote"
                      disabled={!selectedScore || state === "submitting"}
                      onClick={submitVote}
                      size="lg"
                    >
                      {state === "submitting"
                        ? "Saving score..."
                        : entry.currentUserVote == null
                          ? "Submit score"
                          : "Update score"}
                    </Button>
                  </div>
                </div>
              )}

              <AnimatePresence>
                {state === "success" ? (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    aria-live="polite"
                    className="pointer-events-none absolute inset-0 flex items-end justify-center p-6"
                  >
                    <div
                      className="rounded-full border border-radix-teal-a-6 bg-radix-teal-a-4 px-5 py-3 text-sm font-semibold text-accent-foreground shadow-halo"
                      data-testid="vote-saved-toast"
                      role="status"
                    >
                      <CheckCircle2 className="mr-2 inline h-4 w-4" />
                      Vote saved
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
