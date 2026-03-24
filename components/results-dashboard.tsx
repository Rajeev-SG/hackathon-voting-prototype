"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ChevronDown,
  FileSpreadsheet,
  Flag,
  FolderUp,
  Info,
  LoaderCircle,
  Play,
  RotateCcw,
  ShieldCheck,
  TimerReset,
  Trophy
} from "lucide-react";

import type { CompetitionSnapshot, ScoreboardEntryView } from "@/lib/competition-logic";
import { JudgeAuthDialog } from "@/components/judge-auth-dialog";
import { hasPendingJudgeAuthVerification } from "@/components/judge-auth-panel";
import { ResultsScoreboardTable } from "@/components/results-scoreboard-table";
import { ThemeToggle } from "@/components/theme-toggle";
import { VoteDialog } from "@/components/vote-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pushDataLayerEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

function competitionStateMeta(status: CompetitionSnapshot["status"]) {
  if (status === "PREPARING") {
    return {
      label: "Preparing",
      detail: "Workbook loaded and waiting for the manager to open judging.",
      accentClassName:
        "border-[rgb(217_140_20_/_0.2)] bg-[rgb(217_140_20_/_0.08)] text-foreground"
    };
  }

  if (status === "OPEN") {
    return {
      label: "Voting live",
      detail: "Only projects marked open continue to count toward round completion.",
      accentClassName: "border-radix-teal-a-6 bg-radix-teal-a-3 text-accent-foreground"
    };
  }

  return {
    label: "Finalized",
    detail: "Scores are locked and export is ready.",
    accentClassName: "border-radix-purple-a-5 bg-radix-purple-a-4 text-foreground"
  };
}

function scoreboardCopy(snapshot: CompetitionSnapshot, isEmpty: boolean) {
  if (isEmpty) {
    return {
      title: "No projects loaded yet",
      detail: snapshot.viewer.isManager
        ? "Upload the workbook to bring the board to life. Nothing shows here until the real XLSX is loaded."
        : "The board stays intentionally empty until the manager uploads the judging workbook."
    };
  }

  if (snapshot.status === "PREPARING") {
    return {
      title: "Review the field before judges arrive",
      detail: "The board is live already. Managers can still close or reopen individual projects before opening the round."
    };
  }

  if (snapshot.status === "OPEN") {
    return {
      title: "Live standings",
      detail: "Use the table or bar chart to track the ranking, then open a project row to inspect or vote."
    };
  }

  return {
    title: "Final standings",
    detail: "The public board is now locked in its final order."
  };
}

export function ResultsDashboard({ snapshot }: { snapshot: CompetitionSnapshot }) {
  const router = useRouter();
  const [selectedEntry, setSelectedEntry] = React.useState<ScoreboardEntryView | null>(null);
  const [pendingAction, startTransition] = React.useTransition();
  const [pendingEntryId, setPendingEntryId] = React.useState<string | null>(null);
  const [uploadState, setUploadState] = React.useState<{
    status: "idle" | "uploading" | "success" | "error";
    message: string | null;
    issues: Array<{ rowNumber: number; field: string; message: string }>;
  }>({
    status: "idle",
    message: null,
    issues: []
  });
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [actionMessage, setActionMessage] = React.useState<string | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = React.useState(false);
  const [mobileSummaryOpen, setMobileSummaryOpen] = React.useState(false);
  const uploadInputRef = React.useRef<HTMLInputElement>(null);
  const mobileSummaryRef = React.useRef<HTMLDivElement>(null);
  const stateMeta = competitionStateMeta(snapshot.status);
  const isEmpty = snapshot.entries.length === 0;
  const scoreboardMeta = scoreboardCopy(snapshot, isEmpty);
  const analyticsContext = React.useMemo(
    () => ({
      competition_status: snapshot.status.toLowerCase(),
      entry_count: snapshot.progress.entryCount,
      open_entry_count: snapshot.progress.openEntryCount,
      participating_judge_count: snapshot.progress.participatingJudgeCount,
      total_remaining_votes: snapshot.managerTracker.totalRemainingVotes,
      viewer_role: snapshot.viewer.isManager
        ? "manager"
        : snapshot.viewer.isAuthenticated
          ? "judge"
          : "public"
    }),
    [
      snapshot.managerTracker.totalRemainingVotes,
      snapshot.progress.entryCount,
      snapshot.progress.openEntryCount,
      snapshot.progress.participatingJudgeCount,
      snapshot.status,
      snapshot.viewer.isAuthenticated,
      snapshot.viewer.isManager
    ]
  );
  const autoRefreshIntervalMs = snapshot.status === "OPEN" ? 5000 : 15000;
  const autoRefreshPaused =
    Boolean(selectedEntry) ||
    authDialogOpen ||
    uploadState.status === "uploading" ||
    pendingAction ||
    Boolean(pendingEntryId);

  React.useEffect(() => {
    if (snapshot.viewer.isAuthenticated) return;
    if (!hasPendingJudgeAuthVerification()) return;
    setAuthDialogOpen(true);
  }, [snapshot.viewer.isAuthenticated]);

  React.useEffect(() => {
    pushDataLayerEvent("competition_state_snapshot", analyticsContext);
  }, [analyticsContext]);

  React.useEffect(() => {
    if (!mobileSummaryOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!mobileSummaryRef.current?.contains(event.target as Node)) {
        setMobileSummaryOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [mobileSummaryOpen]);

  function refreshBoard() {
    startTransition(() => {
      router.refresh();
    });
  }

  React.useEffect(() => {
    if (autoRefreshPaused) return;

    let intervalId: number | null = null;
    const refreshIfVisible = () => {
      if (document.visibilityState !== "visible" || !window.navigator.onLine) return;
      startTransition(() => {
        router.refresh();
      });
    };

    intervalId = window.setInterval(refreshIfVisible, autoRefreshIntervalMs);
    window.addEventListener("focus", refreshIfVisible);
    document.addEventListener("visibilitychange", refreshIfVisible);

    return () => {
      if (intervalId != null) window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshIfVisible);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [autoRefreshIntervalMs, autoRefreshPaused, router, startTransition]);

  async function sendJson(url: string, init?: RequestInit) {
    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {})
      }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error ?? "The action could not be completed.");
    }
  }

  async function postJson(url: string) {
    return sendJson(url, { method: "POST" });
  }

  async function handleWorkbookUpload(file: File) {
    pushDataLayerEvent("workbook_upload_started", {
      upload_method: isDragOver ? "drag_drop" : "file_picker",
      workbook_extension: file.name.split(".").pop()?.toLowerCase() || "unknown",
      ...analyticsContext
    });
    setUploadState({
      status: "uploading",
      message: "Reading workbook...",
      issues: []
    });

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/competition/upload", {
      method: "POST",
      body: formData
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      pushDataLayerEvent("workbook_upload_failed", {
        issue_count: Array.isArray(payload.issues) ? payload.issues.length : 0,
        ...analyticsContext
      });
      setUploadState({
        status: "error",
        message: payload.error ?? "We could not import that workbook.",
        issues: payload.issues ?? []
      });
      return;
    }

    setUploadState({
      status: "success",
      message: `Imported ${payload.importedCount} project${payload.importedCount === 1 ? "" : "s"}.`,
      issues: []
    });
    pushDataLayerEvent("workbook_upload_completed", {
      imported_project_count: Number(payload.importedCount) || 0,
      ...analyticsContext
    });
    refreshBoard();
  }

  async function handleEntryVotingToggle(entry: ScoreboardEntryView) {
    try {
      setPendingEntryId(entry.id);
      setActionMessage(null);
      await sendJson(`/api/entries/${entry.id}/voting`, {
        method: "PATCH",
        body: JSON.stringify({
          isVotingOpen: !entry.isVotingOpen
        })
      });
      setActionMessage(
        `${entry.projectName} is now ${entry.isVotingOpen ? "closed to new votes." : "open for judging again."}`
      );
      pushDataLayerEvent("entry_voting_state_changed", {
        entry_slug: entry.slug,
        entry_name: entry.projectName,
        voting_state: entry.isVotingOpen ? "closed" : "open",
        ...analyticsContext
      });
      refreshBoard();
    } catch (error) {
      pushDataLayerEvent("entry_voting_state_change_failed", {
        entry_slug: entry.slug,
        ...analyticsContext
      });
      setActionMessage(error instanceof Error ? error.message : "We could not update that project.");
    } finally {
      setPendingEntryId(null);
    }
  }

  function openWorkbookPicker() {
    if (!snapshot.canUploadSheet || uploadState.status === "uploading") return;
    pushDataLayerEvent("workbook_picker_opened", analyticsContext);
    uploadInputRef.current?.click();
  }

  return (
    <div className="min-h-screen">
      <main className="container space-y-5 py-6 sm:space-y-6 sm:py-8">
        <section className="glass-panel flex flex-col gap-5 rounded-[2rem] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-radix-teal-a-4">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="eyebrow">Hackathon voting</div>
                <div className="font-display text-2xl font-black">Single-screen scoreboard</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <ThemeToggle />
              <SignedOut>
                <Button
                  data-analytics-event="judge_auth_dialog_opened"
                  data-analytics-item-name="Judge sign in"
                  data-analytics-item-type="auth_button"
                  data-analytics-section="header"
                  onClick={() => {
                    pushDataLayerEvent("judge_auth_dialog_opened", analyticsContext);
                    setAuthDialogOpen(true);
                  }}
                  data-testid="judge-auth-open"
                  size="sm"
                >
                  Judge sign in
                </Button>
              </SignedOut>
              <SignedIn>
                {snapshot.viewer.isManager ? (
                  <span className="rounded-full bg-radix-teal-a-4 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent-foreground">
                    Manager
                  </span>
                ) : (
                  <span className="rounded-full bg-radix-purple-a-4 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
                    Judge
                  </span>
                )}
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          {snapshot.viewer.isManager ? (
            <Card
              className="glass-panel rounded-[2rem] border-0 bg-transparent shadow-none"
              data-analytics-section="manager_controls"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Manager controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-4 rounded-[1.6rem] border border-border/80 bg-radix-gray-a-3/80 p-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl">
                    <div className="eyebrow">Manager workflow</div>
                    <div className="mt-2 text-lg font-semibold text-foreground">
                      Download the template, upload the workbook, then control the field from the scoreboard itself.
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Every row below now has its own voting-open state. Closed projects remain public on the board, but judges cannot add new votes until you reopen them.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button asChild size="sm" variant="outline">
                      <a
                        data-analytics-event="workbook_template_downloaded"
                        data-analytics-item-name="Workbook template"
                        data-analytics-item-type="template_download"
                        data-analytics-section="manager_controls"
                        data-testid="manager-download-template"
                        href="/api/template"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        Download template
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    </Button>
                    {snapshot.canDownloadFinalizedExport ? (
                      <Button asChild size="sm">
                        <a
                          data-analytics-event="finalized_scores_exported"
                          data-analytics-item-name="Finalized scores"
                          data-analytics-item-type="finalized_export"
                          data-analytics-section="manager_controls"
                          data-testid="manager-export-results"
                          href="/api/export"
                        >
                          Export finalized scores
                          <ArrowUpRight className="h-4 w-4" />
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div
                  className={cn(
                    "rounded-[1.6rem] border border-dashed p-5 transition",
                    isDragOver
                      ? "border-radix-teal-a-7 bg-radix-teal-a-3"
                      : "border-radix-teal-a-6 bg-radix-teal-a-2 hover:border-radix-teal-a-7 hover:bg-radix-teal-a-3"
                  )}
                  data-testid="manager-upload-dropzone"
                  onClick={openWorkbookPicker}
                  onDragLeave={() => setIsDragOver(false)}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsDragOver(false);
                    if (!snapshot.canUploadSheet || uploadState.status === "uploading") return;
                    const file = event.dataTransfer.files?.[0];
                    if (file) void handleWorkbookUpload(file);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openWorkbookPicker();
                    }
                  }}
                  role="button"
                  tabIndex={snapshot.canUploadSheet ? 0 : -1}
                >
                  <input
                    accept=".xlsx"
                    className="sr-only"
                    disabled={!snapshot.canUploadSheet || uploadState.status === "uploading"}
                    ref={uploadInputRef}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void handleWorkbookUpload(file);
                      event.currentTarget.value = "";
                    }}
                    type="file"
                  />

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-semibold text-foreground">Drag, drop, or choose a workbook</div>
                        <div className="text-sm text-muted-foreground">
                          {snapshot.canUploadSheet
                            ? "Upload is available now."
                            : "Upload unlocks again after you reset the round."}
                        </div>
                      </div>
                    </div>
                    <Button
                      data-testid="manager-upload-button"
                      disabled={!snapshot.canUploadSheet || uploadState.status === "uploading"}
                      onClick={(event) => {
                        event.stopPropagation();
                        openWorkbookPicker();
                      }}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <FolderUp className="h-4 w-4" />
                      Choose XLSX
                    </Button>
                  </div>
                </div>

                {uploadState.message ? (
                  <div className="rounded-[1.5rem] border border-border bg-radix-gray-a-3 p-4 text-sm text-muted-foreground">
                    {uploadState.message}
                  </div>
                ) : null}

                {snapshot.viewer.isManager && isEmpty && uploadState.status === "idle" ? (
                  <div className="rounded-[1.5rem] border border-border bg-radix-gray-a-3 p-4 text-sm leading-6 text-muted-foreground">
                    No workbook is loaded right now. Uploading here is the fastest way to bring the public scoreboard to life.
                  </div>
                ) : null}

                {uploadState.issues.length ? (
                  <div className="rounded-[1.5rem] border border-[rgb(204_63_79_/_0.25)] bg-[rgb(204_63_79_/_0.08)] p-4">
                    <div className="font-semibold text-foreground">Workbook issues</div>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {uploadState.issues.map((issue) => (
                        <li key={`${issue.rowNumber}-${issue.field}-${issue.message}`}>
                          Row {issue.rowNumber}: {issue.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="grid gap-3 lg:grid-cols-3">
                  <Button
                    data-testid="manager-begin-voting"
                    disabled={!snapshot.canBeginVoting || pendingAction}
                    onClick={() =>
                      void (async () => {
                        try {
                          setActionMessage(null);
                          await postJson("/api/competition/start");
                          pushDataLayerEvent("competition_round_started", analyticsContext);
                          refreshBoard();
                        } catch (error) {
                          pushDataLayerEvent("competition_round_start_failed", analyticsContext);
                          setActionMessage(error instanceof Error ? error.message : "We could not begin voting.");
                        }
                      })()
                    }
                  >
                    {pendingAction ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    Begin voting
                  </Button>
                  <Button
                    data-testid="manager-finalize"
                    disabled={!snapshot.canFinalize || pendingAction}
                    onClick={() =>
                      void (async () => {
                        try {
                          setActionMessage(null);
                          await postJson("/api/competition/finalize");
                          pushDataLayerEvent("competition_round_finalized", analyticsContext);
                          refreshBoard();
                        } catch (error) {
                          pushDataLayerEvent("competition_round_finalize_failed", analyticsContext);
                          setActionMessage(
                            error instanceof Error ? error.message : "We could not finalize the round."
                          );
                        }
                      })()
                    }
                    variant="secondary"
                  >
                    <Flag className="h-4 w-4" />
                    Finalize scores
                  </Button>
                  <Button
                    data-testid="manager-reset-round"
                    disabled={!snapshot.canResetRound || pendingAction || uploadState.status === "uploading"}
                    onClick={() => {
                      if (
                        !window.confirm(
                          "Reset the round and remove the current workbook, votes, and judging state?"
                        )
                      ) {
                        return;
                      }

                      void (async () => {
                        try {
                          setActionMessage(null);
                          setUploadState({
                            status: "idle",
                            message: null,
                            issues: []
                          });
                          await postJson("/api/competition/reset");
                          pushDataLayerEvent("competition_round_reset", analyticsContext);
                          setActionMessage("Competition reset. Upload a fresh workbook to start the next dry run.");
                          refreshBoard();
                        } catch (error) {
                          pushDataLayerEvent("competition_round_reset_failed", analyticsContext);
                          setActionMessage(error instanceof Error ? error.message : "We could not reset the round.");
                        }
                      })();
                    }}
                    size="sm"
                    type="button"
                    variant="destructive"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset dry run
                  </Button>
                </div>

                {actionMessage ? (
                  <div className="rounded-[1.5rem] border border-[rgb(204_63_79_/_0.25)] bg-[rgb(204_63_79_/_0.08)] p-4 text-sm text-foreground">
                    {actionMessage}
                  </div>
                ) : null}

                <div
                  className="rounded-[1.7rem] border border-border/80 bg-radix-gray-a-3/70 p-4 sm:p-5"
                  data-testid="manager-remaining-votes"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                      <div className="eyebrow">Remaining votes tracker</div>
                      <div className="mt-2 text-lg font-semibold text-foreground">
                        {snapshot.status === "OPEN"
                          ? snapshot.managerTracker.totalRemainingVotes === 0
                            ? "Everyone who joined the round is fully covered."
                            : `${snapshot.managerTracker.totalRemainingVotes} vote${snapshot.managerTracker.totalRemainingVotes === 1 ? "" : "s"} still outstanding.`
                          : "This tracker activates once judging is live."}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {snapshot.managerTracker.helperText}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[1.35rem] border border-border/70 bg-background/35 px-4 py-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Votes left
                        </div>
                        <div className="mt-2 font-display text-3xl font-black text-foreground">
                          {snapshot.managerTracker.totalRemainingVotes}
                        </div>
                      </div>
                      <div className="rounded-[1.35rem] border border-border/70 bg-background/35 px-4 py-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Judges waiting
                        </div>
                        <div className="mt-2 font-display text-3xl font-black text-foreground">
                          {snapshot.managerTracker.judgesStillOutstanding}
                        </div>
                      </div>
                    </div>
                  </div>

                  {snapshot.managerTracker.judges.length > 0 ? (
                    <div className="mt-5 space-y-3">
                      {snapshot.managerTracker.judges.map((judge) => (
                        <div
                          key={judge.judgeEmail}
                          className="rounded-[1.4rem] border border-border/70 bg-background/30 p-4"
                          data-testid={`manager-judge-coverage-${judge.judgeEmail.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`}
                        >
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-foreground">{judge.judgeEmail}</div>
                              <div className="mt-1 text-sm text-muted-foreground">
                                {judge.completedOpenEntries}/{judge.eligibleOpenEntries} open projects covered
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <span
                                className={cn(
                                  "rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em]",
                                  judge.remainingOpenEntries === 0
                                    ? "bg-radix-teal-a-3 text-accent-foreground"
                                    : "bg-radix-amber-a-3 text-foreground"
                                )}
                              >
                                {judge.remainingOpenEntries === 0
                                  ? "Complete"
                                  : `${judge.remainingOpenEntries} left`}
                              </span>
                              {judge.lastActivityAt ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-radix-gray-a-3 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                  <TimerReset className="h-3.5 w-3.5" />
                                  Active
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {judge.remainingProjectNames.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {judge.remainingProjectNames.map((projectName) => (
                                <span
                                  key={`${judge.judgeEmail}-${projectName}`}
                                  className="rounded-full bg-radix-gray-a-3 px-3 py-1.5 text-xs font-semibold text-muted-foreground"
                                >
                                  {projectName}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-3 text-sm text-muted-foreground">
                              No remaining open projects for this judge.
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-5 rounded-[1.4rem] border border-border/70 bg-background/30 p-4 text-sm leading-6 text-muted-foreground">
                      {snapshot.status === "OPEN"
                        ? "No one has cast a score yet, so there is no active judge list to track."
                        : "Once the round is live and the first score comes in, this panel will list exactly who is still outstanding."}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <section
            className="relative space-y-3"
            data-analytics-section="scoreboard"
            data-testid="scoreboard-section"
          >
            <div className="md:hidden" ref={mobileSummaryRef}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="eyebrow">Scoreboard</div>
                  <h1 className="font-display text-2xl font-black" data-testid="scoreboard-primary-heading">
                    {scoreboardMeta.title}
                  </h1>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em]",
                      snapshot.status === "OPEN"
                        ? "bg-radix-teal-a-3 text-accent-foreground"
                        : snapshot.status === "FINALIZED"
                          ? "bg-radix-purple-a-4 text-foreground"
                          : "bg-radix-amber-a-3 text-foreground"
                    )}
                    data-testid="competition-state-badge"
                  >
                    {stateMeta.label}
                  </span>
                  {!isEmpty ? (
                    <Button
                      className="shrink-0"
                      data-testid="scoreboard-mobile-summary-toggle"
                      onClick={() => {
                        const nextOpen = !mobileSummaryOpen;
                        pushDataLayerEvent("scoreboard_summary_toggled", {
                          summary_state: nextOpen ? "open" : "closed",
                          trigger_surface: "mobile",
                          ...analyticsContext
                        });
                        setMobileSummaryOpen(nextOpen);
                      }}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <Info className="h-4 w-4" />
                      Details
                      <ChevronDown
                        className={cn("h-4 w-4 transition", mobileSummaryOpen ? "rotate-180" : "")}
                      />
                    </Button>
                  ) : null}
                </div>
              </div>

              <AnimatePresence>
                {mobileSummaryOpen ? (
                  <motion.div
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute inset-x-0 top-full z-30 mt-3 rounded-[1.5rem] border border-border/80 bg-background/95 p-4 shadow-[0_20px_70px_var(--shadow-soft)] backdrop-blur"
                    data-testid="scoreboard-mobile-summary-panel"
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  >
                    <p className="text-sm leading-6 text-muted-foreground">{scoreboardMeta.detail}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      <span className="rounded-full bg-radix-gray-a-3 px-3 py-2">
                        {snapshot.progress.entryCount} entr{snapshot.progress.entryCount === 1 ? "y" : "ies"}
                      </span>
                      <span className="rounded-full bg-radix-gray-a-3 px-3 py-2">
                        {snapshot.progress.openEntryCount} open now
                      </span>
                      {snapshot.status === "OPEN" ? (
                        <span className="rounded-full bg-radix-gray-a-3 px-3 py-2">
                          {snapshot.progress.participatingJudgeCount} judging now
                        </span>
                      ) : null}
                      {snapshot.viewer.isManager && snapshot.status === "OPEN" ? (
                        <span className="rounded-full bg-radix-gray-a-3 px-3 py-2">
                          {snapshot.managerTracker.totalRemainingVotes} votes left
                        </span>
                      ) : null}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <div className="hidden flex-col gap-3 lg:flex-row lg:items-end lg:justify-between md:flex">
              <div className="max-w-2xl">
                <div className="eyebrow">Scoreboard</div>
                <h1 className="font-display text-2xl font-black">{scoreboardMeta.title}</h1>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{scoreboardMeta.detail}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <span className="rounded-full bg-radix-gray-a-3 px-3 py-2">
                  {snapshot.progress.entryCount} entr{snapshot.progress.entryCount === 1 ? "y" : "ies"}
                </span>
                <span className="rounded-full bg-radix-gray-a-3 px-3 py-2">
                  {snapshot.progress.openEntryCount} open now
                </span>
                {snapshot.status === "OPEN" ? (
                  <span className="rounded-full bg-radix-gray-a-3 px-3 py-2">
                    {snapshot.progress.participatingJudgeCount} judging now
                  </span>
                ) : null}
                {snapshot.viewer.isManager && snapshot.status === "OPEN" ? (
                  <span className="rounded-full bg-radix-gray-a-3 px-3 py-2">
                    {snapshot.managerTracker.totalRemainingVotes} votes left
                  </span>
                ) : null}
                <span
                  className={cn(
                    "rounded-full px-3 py-2",
                    snapshot.status === "OPEN"
                      ? "bg-radix-teal-a-3 text-accent-foreground"
                      : snapshot.status === "FINALIZED"
                        ? "bg-radix-purple-a-4 text-foreground"
                        : "bg-radix-amber-a-3 text-foreground"
                  )}
                  data-testid="competition-state-badge"
                >
                  {stateMeta.label}
                </span>
              </div>
            </div>

            <ResultsScoreboardTable
              entries={snapshot.entries}
              onSelectEntry={(entry) => setSelectedEntry(entry)}
              onToggleEntryVoting={snapshot.viewer.isManager ? handleEntryVotingToggle : undefined}
              pendingEntryId={pendingEntryId}
              status={snapshot.status}
              viewer={snapshot.viewer}
            />
          </section>
        </section>
      </main>

      <VoteDialog
        entry={selectedEntry}
        onOpenChange={(open) => {
          if (!open) setSelectedEntry(null);
        }}
        onVoteSaved={refreshBoard}
        open={Boolean(selectedEntry)}
        status={snapshot.status}
        viewer={snapshot.viewer}
      />
      <JudgeAuthDialog onOpenChange={setAuthDialogOpen} open={authDialogOpen} />
    </div>
  );
}
