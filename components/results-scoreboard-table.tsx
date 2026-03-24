"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, ChevronDown, Lock, PauseCircle, PlayCircle, Table2, Vote } from "lucide-react";

import type { ScoreboardEntryView, ViewerIdentity } from "@/lib/competition-logic";
import { pushDataLayerEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ResultsScoreboardTableProps = {
  entries: ScoreboardEntryView[];
  status: "PREPARING" | "OPEN" | "FINALIZED";
  viewer: ViewerIdentity;
  onSelectEntry: (entry: ScoreboardEntryView) => void;
  onToggleEntryVoting?: (entry: ScoreboardEntryView) => void;
  pendingEntryId?: string | null;
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
  if (entry.currentUserVote != null) return "Scored";
  if (!entry.isVotingOpen) return "Closed";
  if (status === "PREPARING") return "Opens soon";
  if (entry.isSelfVoteBlocked) return "Team member";
  if (!viewer.isAuthenticated) return "Sign in";
  return "Vote";
}

function votingStateLabel(entry: ScoreboardEntryView, status: "PREPARING" | "OPEN" | "FINALIZED") {
  if (status === "FINALIZED") return "Final";
  return entry.isVotingOpen ? "Open" : "Closed";
}

function ScoreboardActionButton({
  entry,
  status,
  viewer,
  onSelectEntry
}: {
  entry: ScoreboardEntryView;
  status: "PREPARING" | "OPEN" | "FINALIZED";
  viewer: ViewerIdentity;
  onSelectEntry: (entry: ScoreboardEntryView) => void;
}) {
  return (
    <Button
      className="min-w-[118px] justify-center"
      data-testid={`scoreboard-action-${entry.slug}`}
      onClick={(event) => {
        event.stopPropagation();
        onSelectEntry(entry);
      }}
      size="sm"
      type="button"
      variant={entry.canVote ? "default" : "outline"}
    >
      {entry.canVote ? <Vote className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
      {actionLabel({ entry, status, viewer })}
    </Button>
  );
}

function ManagerVotingToggle({
  entry,
  status,
  onToggleEntryVoting,
  pendingEntryId
}: {
  entry: ScoreboardEntryView;
  status: "PREPARING" | "OPEN" | "FINALIZED";
  onToggleEntryVoting?: (entry: ScoreboardEntryView) => void;
  pendingEntryId?: string | null;
}) {
  if (!onToggleEntryVoting) return null;

  return (
    <Button
      data-testid={`manager-entry-toggle-${entry.slug}`}
      disabled={status === "FINALIZED" || pendingEntryId === entry.id}
      onClick={(event) => {
        event.stopPropagation();
        onToggleEntryVoting(entry);
      }}
      size="sm"
      type="button"
      variant="outline"
    >
      {entry.isVotingOpen ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
      {entry.isVotingOpen ? "Close voting" : "Reopen voting"}
    </Button>
  );
}

function EntryMetaPills({
  entry,
  status
}: {
  entry: ScoreboardEntryView;
  status: "PREPARING" | "OPEN" | "FINALIZED";
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="rounded-full bg-radix-gray-a-3 px-3 py-1 text-xs font-semibold text-muted-foreground">
        {entry.voteCount} vote{entry.voteCount === 1 ? "" : "s"}
      </span>
      <span
        className={cn(
          "rounded-full px-3 py-1 text-xs font-semibold",
          entry.isVotingOpen
            ? "bg-radix-teal-a-3 text-accent-foreground"
            : "bg-radix-amber-a-3 text-foreground"
        )}
      >
        {votingStateLabel(entry, status)}
      </span>
      <span className="rounded-full bg-radix-purple-a-4 px-3 py-1 text-xs font-semibold text-foreground">
        {entry.averageScore == null ? "Awaiting scores" : `${entry.averageScore} avg`}
      </span>
    </div>
  );
}

function ChartView({
  entries,
  status,
  viewer,
  onSelectEntry,
  onToggleEntryVoting,
  pendingEntryId
}: Omit<ResultsScoreboardTableProps, "entries"> & { entries: ScoreboardEntryView[] }) {
  const maxScore = Math.max(...entries.map((entry) => entry.totalScore), 1);

  return (
    <div className="space-y-3" data-testid="scoreboard-chart-view">
      <AnimatePresence initial={false}>
        {entries.map((entry) => {
          const width = Math.max((entry.totalScore / maxScore) * 100, entry.totalScore === 0 ? 8 : 14);

          return (
            <motion.div
              layout
              className="glass-panel flex cursor-pointer flex-col gap-4 rounded-[1.75rem] p-4 transition hover:bg-radix-teal-a-2 focus-within:bg-radix-teal-a-2 sm:p-5"
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
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-radix-teal-a-4 font-display text-sm font-black text-primary">
                      {entry.rank}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="truncate font-semibold text-foreground">{entry.projectName}</div>
                        <EntryMetaPills entry={entry} status={status} />
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">{entry.teamName ?? "Team name pending"}</div>
                      {entry.summary ? (
                        <div className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{entry.summary}</div>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      <span>Aggregate score</span>
                      <span>{entry.totalScore}</span>
                    </div>
                    <div className="mt-2 h-4 overflow-hidden rounded-full bg-radix-gray-a-3">
                      <motion.div
                        animate={{ width: `${width}%` }}
                        className={cn(
                          "h-full rounded-full",
                          entry.isVotingOpen
                            ? "bg-[linear-gradient(90deg,var(--accent),rgba(72,229,254,0.45))]"
                            : "bg-[linear-gradient(90deg,rgba(217,140,20,0.85),rgba(217,140,20,0.35))]"
                        )}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 lg:max-w-[16rem] lg:justify-end">
                  <ScoreboardActionButton
                    entry={entry}
                    onSelectEntry={onSelectEntry}
                    status={status}
                    viewer={viewer}
                  />
                  <ManagerVotingToggle
                    entry={entry}
                    onToggleEntryVoting={onToggleEntryVoting}
                    pendingEntryId={pendingEntryId}
                    status={status}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function ResultsScoreboardTable({
  entries,
  status,
  viewer,
  onSelectEntry,
  onToggleEntryVoting,
  pendingEntryId
}: ResultsScoreboardTableProps) {
  const [viewMode, setViewMode] = React.useState<"table" | "chart">("table");
  const [mobileViewPanelOpen, setMobileViewPanelOpen] = React.useState(false);
  const mobileViewPanelRef = React.useRef<HTMLDivElement>(null);
  const showManagerControls = viewer.isManager;

  React.useEffect(() => {
    if (!mobileViewPanelOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!mobileViewPanelRef.current?.contains(event.target as Node)) {
        setMobileViewPanelOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [mobileViewPanelOpen]);

  function handleViewModeChange(nextViewMode: "table" | "chart", triggerSurface: "mobile" | "desktop") {
    setViewMode(nextViewMode);
    pushDataLayerEvent("scoreboard_view_changed", {
      board_view: nextViewMode,
      trigger_surface: triggerSurface,
      entry_count: entries.length,
      viewer_role: viewer.isManager ? "manager" : viewer.isAuthenticated ? "judge" : "public"
    });
  }

  if (entries.length === 0) {
    return (
      <div className="glass-panel rounded-[2rem] border border-border/80 p-6 sm:p-8">
        <div className="eyebrow">Workbook-driven board</div>
        <h3 className="mt-3 font-display text-2xl font-black text-foreground" data-testid="scoreboard-empty-heading">
          No projects loaded yet
        </h3>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
          This board fills with real judging data as soon as the manager uploads the XLSX workbook.
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <span className="rounded-full bg-radix-gray-a-3 px-3 py-2">No placeholder projects</span>
          <span className="rounded-full bg-radix-gray-a-3 px-3 py-2">
            {viewer.isManager && status === "PREPARING"
              ? "Upload a workbook to begin"
              : "Waiting for manager workbook upload"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-4">
      <div className="md:hidden" ref={mobileViewPanelRef}>
        <div className="flex items-center justify-between rounded-[1.35rem] border border-border/70 bg-radix-gray-a-2/65 px-3 py-2.5">
          <div>
            <div className="text-sm font-semibold text-foreground">Board view</div>
            <div className="text-xs text-muted-foreground">
              {viewMode === "table" ? "Ranked table active" : "Horizontal bar chart active"}
            </div>
          </div>
          <Button
            data-testid="scoreboard-mobile-view-toggle"
            onClick={() => setMobileViewPanelOpen((open) => !open)}
            size="sm"
            type="button"
            variant="outline"
          >
            {viewMode === "table" ? <Table2 className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
            {viewMode === "table" ? "Table" : "Bar chart"}
            <ChevronDown className={cn("h-4 w-4 transition", mobileViewPanelOpen ? "rotate-180" : "")} />
          </Button>
        </div>

        <AnimatePresence>
          {mobileViewPanelOpen ? (
            <motion.div
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="absolute inset-x-0 top-full z-30 mt-3 rounded-[1.5rem] border border-border/80 bg-background/95 p-4 shadow-[0_20px_70px_var(--shadow-soft)] backdrop-blur"
              data-testid="scoreboard-mobile-view-panel"
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
            >
              <div className="text-sm font-semibold text-foreground">Choose how the board reads</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Switch between the ranked table and the horizontal bar chart without losing your place.
              </div>
              <div className="mt-4 inline-flex w-full rounded-full bg-radix-gray-a-3 p-1">
                <button
                  className={cn(
                    "inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                    viewMode === "table" ? "bg-background text-foreground shadow-soft" : "text-muted-foreground"
                  )}
                  data-testid="scoreboard-view-table"
                  onClick={() => {
                    handleViewModeChange("table", "mobile");
                    setMobileViewPanelOpen(false);
                  }}
                  type="button"
                >
                  <Table2 className="h-4 w-4" />
                  Table
                </button>
                <button
                  className={cn(
                    "inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                    viewMode === "chart" ? "bg-background text-foreground shadow-soft" : "text-muted-foreground"
                  )}
                  data-testid="scoreboard-view-chart"
                  onClick={() => {
                    handleViewModeChange("chart", "mobile");
                    setMobileViewPanelOpen(false);
                  }}
                  type="button"
                >
                  <BarChart3 className="h-4 w-4" />
                  Bar chart
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="hidden flex-col gap-3 rounded-[1.7rem] border border-border/70 bg-radix-gray-a-2/65 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4 md:flex">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground">Board view</div>
          <div className="text-sm text-muted-foreground">
            Switch between the ranked table and a horizontal bar chart without leaving the scoreboard.
          </div>
        </div>
        <div className="inline-flex w-full rounded-full bg-radix-gray-a-3 p-1 sm:w-auto">
          <button
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
              viewMode === "table" ? "bg-background text-foreground shadow-soft" : "text-muted-foreground"
            )}
            data-testid="scoreboard-view-table"
            onClick={() => handleViewModeChange("table", "desktop")}
            type="button"
          >
            <Table2 className="h-4 w-4" />
            Table
          </button>
          <button
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
              viewMode === "chart" ? "bg-background text-foreground shadow-soft" : "text-muted-foreground"
            )}
            data-testid="scoreboard-view-chart"
            onClick={() => handleViewModeChange("chart", "desktop")}
            type="button"
          >
            <BarChart3 className="h-4 w-4" />
            Bar chart
          </button>
        </div>
      </div>

      {viewMode === "chart" ? (
        <ChartView
          entries={entries}
          onSelectEntry={onSelectEntry}
          onToggleEntryVoting={showManagerControls ? onToggleEntryVoting : undefined}
          pendingEntryId={pendingEntryId}
          status={status}
          viewer={viewer}
        />
      ) : (
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

                  <EntryMetaPills entry={entry} status={status} />

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Aggregate
                      </div>
                      <motion.div layout className="font-display text-3xl font-black text-foreground">
                        {entry.totalScore}
                      </motion.div>
                    </div>
                    <ScoreboardActionButton
                      entry={entry}
                      onSelectEntry={onSelectEntry}
                      status={status}
                      viewer={viewer}
                    />
                  </div>

                  {showManagerControls ? (
                    <div className="flex justify-end">
                      <ManagerVotingToggle
                        entry={entry}
                        onToggleEntryVoting={onToggleEntryVoting}
                        pendingEntryId={pendingEntryId}
                        status={status}
                      />
                    </div>
                  ) : null}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div
            className="hidden overflow-hidden rounded-[2rem] border border-border bg-radix-gray-a-2 md:block"
            data-testid="scoreboard-table-view"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-separate border-spacing-0">
                <thead>
                  <tr className="text-left">
                    {["Rank", "Project", "Votes", "Aggregate", "Status", "Action"]
                      .concat(showManagerControls ? ["Manager"] : [])
                      .map((header) => (
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
                            <div className="min-w-0">
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
                        <td className="border-b border-border px-5 py-4">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em]",
                              entry.isVotingOpen
                                ? "bg-radix-teal-a-3 text-accent-foreground"
                                : "bg-radix-amber-a-3 text-foreground"
                            )}
                          >
                            {votingStateLabel(entry, status)}
                          </span>
                        </td>
                        <td
                          className="border-b border-border px-5 py-4"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <ScoreboardActionButton
                            entry={entry}
                            onSelectEntry={onSelectEntry}
                            status={status}
                            viewer={viewer}
                          />
                        </td>
                        {showManagerControls ? (
                          <td
                            className="border-b border-border px-5 py-4"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <ManagerVotingToggle
                              entry={entry}
                              onToggleEntryVoting={onToggleEntryVoting}
                              pendingEntryId={pendingEntryId}
                              status={status}
                            />
                          </td>
                        ) : null}
                      </motion.tr>
                    ))}
                  </motion.tbody>
                </AnimatePresence>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
