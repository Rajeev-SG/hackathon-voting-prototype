"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Lock, Vote } from "lucide-react";

import type { ScoreboardEntryView, ViewerIdentity } from "@/lib/competition-logic";
import { Button } from "@/components/ui/button";

type ResultsScoreboardTableProps = {
  entries: ScoreboardEntryView[];
  status: "PREPARING" | "OPEN" | "FINALIZED";
  viewer: ViewerIdentity;
  onSelectEntry: (entry: ScoreboardEntryView) => void;
};

function actionLabel({
  entry,
  status,
  viewer
}: {
  entry: ScoreboardEntryView;
  status: "PREPARING" | "OPEN" | "FINALIZED";
  viewer: ViewerIdentity;
}) {
  if (status === "FINALIZED") return "Locked";
  if (status === "PREPARING") return "Opens soon";
  if (entry.isSelfVoteBlocked) return "Team member";
  if (!viewer.isAuthenticated) return "Sign in";
  return entry.currentUserVote == null ? "Vote" : "Update";
}

export function ResultsScoreboardTable({
  entries,
  status,
  viewer,
  onSelectEntry
}: ResultsScoreboardTableProps) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        <AnimatePresence initial={false}>
          {entries.map((entry) => (
            <motion.div
              layout
              className="glass-panel flex cursor-pointer flex-col gap-4 rounded-[1.7rem] p-4 text-left transition hover:bg-radix-teal-a-2 focus-within:bg-radix-teal-a-2"
              data-testid={`scoreboard-row-${entry.slug}`}
              key={entry.id}
              onClick={() => onSelectEntry(entry)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectEntry(entry);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-radix-teal-a-4 font-display text-sm font-black text-primary">
                  {entry.rank}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-radix-purple-a-4 font-display text-lg font-black text-foreground">
                      {entry.projectName.slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-foreground">{entry.projectName}</div>
                      <div className="truncate text-sm text-muted-foreground">
                        {entry.teamName ?? "Team name pending"}
                      </div>
                    </div>
                  </div>
                  {entry.summary ? (
                    <div className="mt-3 line-clamp-2 text-xs leading-6 text-muted-foreground">{entry.summary}</div>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-radix-gray-a-3 px-3 py-1 text-xs font-semibold text-muted-foreground">
                  {entry.voteCount} vote{entry.voteCount === 1 ? "" : "s"}
                </span>
                <span className="rounded-full bg-radix-teal-a-3 px-3 py-1 text-xs font-semibold text-accent-foreground">
                  {entry.averageScore == null ? "Awaiting scores" : `${entry.averageScore} avg`}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Aggregate
                  </div>
                  <motion.div layout className="font-display text-3xl font-black text-foreground">
                    {entry.totalScore}
                  </motion.div>
                </div>
                <Button
                  className="min-w-[118px] justify-center"
                  data-testid={`scoreboard-action-${entry.slug}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectEntry(entry);
                  }}
                  size="sm"
                  type="button"
                  variant={status === "OPEN" && !entry.isSelfVoteBlocked ? "default" : "outline"}
                >
                  {status !== "OPEN" || entry.isSelfVoteBlocked ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <Vote className="h-4 w-4" />
                  )}
                  {actionLabel({ entry, status, viewer })}
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="hidden overflow-hidden rounded-[2rem] border border-border bg-radix-gray-a-2 md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-separate border-spacing-0">
            <thead>
              <tr className="text-left">
                {["Rank", "Project", "Votes", "Aggregate", "Action"].map((header) => (
                  <th
                    key={header}
                    className="border-b border-border px-5 py-4 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <AnimatePresence initial={false}>
              <motion.tbody layout>
                {entries.map((entry) => (
                  <motion.tr
                    data-testid={`scoreboard-row-${entry.slug}`}
                    layout
                    key={entry.id}
                    className="group cursor-pointer transition hover:bg-radix-teal-a-2 focus-within:bg-radix-teal-a-2"
                    onClick={() => onSelectEntry(entry)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelectEntry(entry);
                      }
                    }}
                    tabIndex={0}
                  >
                    <td className="border-b border-border px-5 py-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-radix-teal-a-4 font-display text-sm font-black text-primary">
                        {entry.rank}
                      </div>
                    </td>
                    <td className="border-b border-border px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-radix-purple-a-4 font-display text-lg font-black text-foreground">
                          {entry.projectName.slice(0, 1)}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{entry.projectName}</div>
                          <div className="text-sm text-muted-foreground">
                            {entry.teamName ?? "Team name pending"}
                          </div>
                          {entry.summary ? (
                            <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">{entry.summary}</div>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-border px-5 py-4 text-sm text-muted-foreground">
                      {entry.voteCount} vote{entry.voteCount === 1 ? "" : "s"}
                    </td>
                    <td className="border-b border-border px-5 py-4">
                      <motion.div layout className="font-display text-2xl font-black text-foreground">
                        {entry.totalScore}
                        <span className="ml-2 text-sm font-medium text-muted-foreground">
                          {entry.averageScore == null ? "No scores yet" : `${entry.averageScore} avg`}
                        </span>
                      </motion.div>
                    </td>
                    <td
                      className="border-b border-border px-5 py-4"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Button
                        className="min-w-[118px] justify-center"
                        data-testid={`scoreboard-action-${entry.slug}`}
                        onClick={() => onSelectEntry(entry)}
                        size="sm"
                        variant={status === "OPEN" && !entry.isSelfVoteBlocked ? "default" : "outline"}
                      >
                        {status !== "OPEN" || entry.isSelfVoteBlocked ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <Vote className="h-4 w-4" />
                        )}
                        {actionLabel({ entry, status, viewer })}
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </AnimatePresence>
          </table>
        </div>
      </div>
    </>
  );
}
