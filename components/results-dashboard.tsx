"use client";

import * as React from "react";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  FileSpreadsheet,
  Flag,
  FolderUp,
  LoaderCircle,
  Play,
  RotateCcw,
  ShieldCheck,
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
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

function statusCopy(status: CompetitionSnapshot["status"]) {
  if (status === "PREPARING") {
    return {
      eyebrow: "Manager setup",
      body: "Load the workbook, sanity-check the field, and open judging when the room is ready."
    };
  }

  if (status === "OPEN") {
    return {
      eyebrow: "Judging live",
      body: "The public board stays live while signed-in judges cast their one locked score from the modal."
    };
  }

  return {
    eyebrow: "Finalized",
    body: "Judging is complete. The standings are locked and the manager can export the official workbook."
  };
}

function progressStateMeta(status: CompetitionSnapshot["status"]) {
  if (status === "PREPARING") {
    return {
      label: "Preparing",
      detail: "Workbook loaded. Waiting for the manager to open judging.",
      accentClassName:
        "border-[rgb(217_140_20_/_0.2)] bg-[rgb(217_140_20_/_0.08)] text-foreground"
    };
  }

  if (status === "OPEN") {
    return {
      label: "Voting live",
      detail: "Judges can cast one locked vote per project while the board updates in public.",
      accentClassName: "border-radix-teal-a-6 bg-radix-teal-a-3 text-accent-foreground"
    };
  }

  return {
    label: "Finalized",
    detail: "Scores are locked, the board is final, and export is ready.",
    accentClassName: "border-radix-purple-a-5 bg-radix-purple-a-4 text-foreground"
  };
}

function nextActionMeta(snapshot: CompetitionSnapshot, isEmpty: boolean) {
  if (snapshot.status === "FINALIZED") {
    return snapshot.viewer.isManager
      ? {
          title: "Export the final workbook",
          detail: "The public result is locked now. Download the official export when you need the final scores."
        }
      : {
          title: "Review the final standings",
          detail: "Voting is closed. Use the board to review the finished ranking and aggregate scores."
        };
  }

  if (snapshot.status === "OPEN") {
    if (!snapshot.viewer.isAuthenticated) {
      return {
        title: "Sign in to judge",
        detail: "Open any project row, sign in once, and cast your one locked vote where you are eligible."
      };
    }

    if (snapshot.viewer.isManager) {
      return {
        title: "Monitor coverage and finalize",
        detail: "Watch completion in the right rail and finalize as soon as every participating judge has covered every eligible project."
      };
    }

    return {
      title: "Open a row and score it",
      detail: "Choose a project from the board, score it once in the modal, and move on."
    };
  }

  if (snapshot.viewer.isManager) {
    return snapshot.canUploadSheet
      ? {
          title: isEmpty ? "Upload the judging workbook" : "Review the board, then begin voting",
          detail: isEmpty
            ? "Download the template, fill one row per project, and upload it to populate the board."
            : "The board is populated. Confirm the entries look right, then open judging when the room is ready."
        }
      : {
          title: "Reset to replace the workbook",
          detail: "Voting has already moved forward. Reset the dry run if you need to upload a different workbook."
        };
  }

  return {
    title: "Watch the board until judging opens",
    detail: "Everyone can view the board immediately. Voting unlocks once the manager opens the round."
  };
}

function scoreboardCopy(snapshot: CompetitionSnapshot, isEmpty: boolean) {
  if (isEmpty) {
    return {
      title: "Workbook-driven scoreboard",
      detail: snapshot.viewer.isManager
        ? "Use the manager rail to load the XLSX. The board stays intentionally empty until real judging data is uploaded."
        : "The board stays intentionally empty until the manager uploads the judging workbook."
    };
  }

  if (snapshot.status === "PREPARING") {
    return {
      title: "Field loaded and ready for review",
      detail: "The public board is already visible, and the manager can still replace the workbook before opening voting."
    };
  }

  if (snapshot.status === "OPEN") {
    return {
      title: "Live standings",
      detail: "The ranking updates in public as judges score. Open a row to vote, or use the board to see why a project is locked for you."
    };
  }

  return {
    title: "Final standings",
    detail: "The public scoreboard is locked. Open a row to inspect the final project details and voting state."
  };
}

export function ResultsDashboard({ snapshot }: { snapshot: CompetitionSnapshot }) {
  const router = useRouter();
  const [selectedEntry, setSelectedEntry] = React.useState<ScoreboardEntryView | null>(null);
  const [pendingAction, startTransition] = React.useTransition();
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
  const uploadInputRef = React.useRef<HTMLInputElement>(null);
  const copy = statusCopy(snapshot.status);
  const stateMeta = progressStateMeta(snapshot.status);
  const isEmpty = snapshot.entries.length === 0;
  const nextAction = nextActionMeta(snapshot, isEmpty);
  const scoreboardMeta = scoreboardCopy(snapshot, isEmpty);
  const autoRefreshIntervalMs = snapshot.status === "OPEN" ? 5000 : 15000;
  const autoRefreshPaused =
    Boolean(selectedEntry) ||
    authDialogOpen ||
    uploadState.status === "uploading" ||
    pendingAction;

  React.useEffect(() => {
    if (snapshot.viewer.isAuthenticated) return;
    if (!hasPendingJudgeAuthVerification()) return;
    setAuthDialogOpen(true);
  }, [snapshot.viewer.isAuthenticated]);

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

  async function postJson(url: string) {
    const response = await fetch(url, {
      method: "POST"
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error ?? "The action could not be completed.");
    }
  }

  async function handleWorkbookUpload(file: File) {
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
    refreshBoard();
  }

  function openWorkbookPicker() {
    if (!snapshot.canUploadSheet || uploadState.status === "uploading") return;
    uploadInputRef.current?.click();
  }

  return (
    <div className="min-h-screen">
      <main className="container space-y-6 py-6 sm:space-y-8 sm:py-8">
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
                <Button data-testid="judge-auth-open" onClick={() => setAuthDialogOpen(true)} size="sm">
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

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.58fr)_minmax(320px,0.84fr)]">
          <div className="space-y-4">
            <div className="glass-panel shell-surface rounded-[2rem] px-4 py-4 sm:px-6 sm:py-5" data-testid="workflow-summary">
              <div className="space-y-5">
                <div className="max-w-3xl">
                  <div className="eyebrow">{copy.eyebrow}</div>
                  <h1 className="mt-3 font-display text-[clamp(2rem,3vw,3rem)] font-black tracking-tight text-foreground">
                    Live hackathon scoreboard
                  </h1>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
                    {copy.body}
                  </p>
                </div>
                <div className="grid gap-3 min-[520px]:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-[1.45rem] border border-border/80 bg-radix-gray-a-3/90 p-4">
                    <div className="eyebrow">Current mode</div>
                    <div className="mt-3 font-display text-xl font-black leading-tight text-foreground sm:text-2xl">
                      {stateMeta.label}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{stateMeta.detail}</p>
                  </div>
                  <div className="rounded-[1.45rem] border border-border/80 bg-radix-gray-a-3/90 p-4">
                    <div className="eyebrow">Next move</div>
                    <div className="mt-3 text-base font-semibold text-foreground">{nextAction.title}</div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{nextAction.detail}</p>
                  </div>
                  <div className="hidden rounded-[1.45rem] border border-border/80 bg-radix-gray-a-3/90 p-4 xl:block">
                    <div className="eyebrow">Guardrails</div>
                    <div className="mt-3 text-base font-semibold text-foreground">One locked vote, no self-scoring</div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      One vote per project. Uploaded team emails block self-votes automatically.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3" data-testid="scoreboard-section">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <div className="eyebrow">Scoreboard</div>
                  <h2 className="font-display text-2xl font-black">{scoreboardMeta.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{scoreboardMeta.detail}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <span className="rounded-full bg-radix-teal-a-3 px-3 py-2 text-accent-foreground">
                    Public board
                  </span>
                  <span className="rounded-full bg-radix-gray-a-3 px-3 py-2">
                    {snapshot.progress.entryCount} entr{snapshot.progress.entryCount === 1 ? "y" : "ies"}
                  </span>
                  <span className="rounded-full bg-radix-gray-a-3 px-3 py-2">
                    {snapshot.status === "OPEN" ? "Judging live" : snapshot.status === "FINALIZED" ? "Results locked" : "Waiting to open"}
                  </span>
                </div>
              </div>
              <ResultsScoreboardTable
                entries={snapshot.entries}
                onSelectEntry={setSelectedEntry}
                status={snapshot.status}
                viewer={snapshot.viewer}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Card className="glass-panel rounded-[2rem] border-0 bg-transparent shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Judging progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="flex items-end gap-3">
                    <div className="font-display text-5xl font-black text-primary">{snapshot.progress.percentage}%</div>
                    <div className="pb-2 text-sm font-semibold text-muted-foreground">
                      {snapshot.progress.castVotes}/
                      {snapshot.progress.expectedVotes || snapshot.progress.entryCount}
                    </div>
                  </div>
                  <span className="rounded-full bg-radix-gray-a-3 px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Refreshes every {Math.round(autoRefreshIntervalMs / 1000)}s
                  </span>
                </div>
                <Progress value={snapshot.progress.percentage} />
                <p className="text-sm leading-7 text-muted-foreground">{snapshot.progress.helperText}</p>
                <div className="grid gap-3 min-[560px]:grid-cols-2">
                  <div
                    data-testid="progress-stat-entries"
                    className="flex min-h-[132px] flex-col justify-between rounded-[1.55rem] border border-border/80 bg-radix-gray-a-3 p-4"
                  >
                    <div className="eyebrow">Entries</div>
                    <div
                      data-testid="progress-stat-entries-value"
                      className="mt-4 font-display text-[1.85rem] font-black leading-[0.95] tracking-tight sm:text-[2rem]"
                    >
                      {snapshot.progress.entryCount}
                    </div>
                    <p className="mt-4 text-xs leading-5 text-muted-foreground">Projects currently shown on the board.</p>
                  </div>
                  <div
                    data-testid="progress-stat-judges"
                    className="flex min-h-[132px] flex-col justify-between rounded-[1.55rem] border border-border/80 bg-radix-gray-a-3 p-4"
                  >
                    <div className="eyebrow">Judges in round</div>
                    <div
                      data-testid="progress-stat-judges-value"
                      className="mt-4 font-display text-[1.85rem] font-black leading-[0.95] tracking-tight sm:text-[2rem]"
                    >
                      {snapshot.progress.participatingJudgeCount}
                    </div>
                    <p className="mt-4 text-xs leading-5 text-muted-foreground">
                      The denominator only counts judges who have started scoring.
                    </p>
                  </div>
                  <div
                    data-testid="progress-stat-state"
                    className={cn(
                      "flex min-h-[132px] flex-col justify-between rounded-[1.55rem] border p-4 min-[560px]:col-span-2",
                      stateMeta.accentClassName
                    )}
                  >
                    <div className="eyebrow">State</div>
                    <div
                      data-testid="progress-stat-state-value"
                      className="mt-4 font-display text-[1.6rem] font-black leading-[1.02] tracking-tight sm:text-[1.85rem]"
                    >
                      {stateMeta.label}
                    </div>
                    <p className="mt-4 text-xs leading-5 opacity-90">{stateMeta.detail}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel rounded-[2rem] border-0 bg-transparent shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{snapshot.viewer.isManager ? "Manager controls" : "Judge access"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {snapshot.viewer.isManager ? (
                  <>
                    <div className="rounded-[1.5rem] border border-border bg-radix-gray-a-3 p-4">
                      <div className="eyebrow">Primary setup</div>
                      <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                        <FileSpreadsheet className="h-4 w-4 text-primary" />
                        Download, upload, then open judging
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Keep one project per row, use unique project names, and include team emails so self-voting can be blocked automatically.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Button asChild size="sm" variant="outline">
                          <a data-testid="manager-download-template" href="/api/template">
                            Download template
                            <ArrowUpRight className="h-4 w-4" />
                          </a>
                        </Button>
                        {snapshot.canDownloadFinalizedExport ? (
                          <Button asChild size="sm">
                            <a data-testid="manager-export-results" href="/api/export">
                              Export finalized scores
                              <ArrowUpRight className="h-4 w-4" />
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    <div
                      className={`rounded-[1.5rem] border border-dashed p-5 transition ${
                        isDragOver
                          ? "border-radix-teal-a-7 bg-radix-teal-a-3"
                          : "border-radix-teal-a-6 bg-radix-teal-a-2 hover:border-radix-teal-a-7 hover:bg-radix-teal-a-3"
                      }`}
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
                                : "Upload unlocks again after you reset the round back to manager setup."}
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

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Button
                        data-testid="manager-begin-voting"
                        disabled={!snapshot.canBeginVoting || pendingAction}
                        onClick={() =>
                          void (async () => {
                            try {
                              setActionMessage(null);
                              await postJson("/api/competition/start");
                              refreshBoard();
                            } catch (error) {
                              setActionMessage(
                                error instanceof Error ? error.message : "We could not begin voting."
                              );
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
                              refreshBoard();
                            } catch (error) {
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
                    </div>

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
                            setActionMessage("Competition reset. Upload a fresh workbook to start the next dry run.");
                            refreshBoard();
                          } catch (error) {
                            setActionMessage(
                              error instanceof Error ? error.message : "We could not reset the round."
                            );
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
                  </>
                ) : (
                  <>
                    <div className="rounded-[1.5rem] border border-border bg-radix-gray-a-3 p-4">
                      <div className="eyebrow">Next move</div>
                      <div className="mt-2 text-base font-semibold text-foreground">{nextAction.title}</div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{nextAction.detail}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-border bg-radix-gray-a-3 p-4 text-sm leading-6 text-muted-foreground">
                      Anyone can view the board. Judges sign in once, cast one score per project from the modal, and that score stays locked unless the manager resets the whole round.
                    </div>
                    <div className="rounded-[1.5rem] border border-border bg-radix-gray-a-3 p-4 text-sm leading-6 text-muted-foreground">
                      Self-voting is blocked from uploaded team emails, and completion only counts entries a given judge is actually allowed to score.
                    </div>
                    <SignedOut>
                      <Button
                        className="w-full justify-center"
                        data-testid="judge-auth-open-secondary"
                        onClick={() => setAuthDialogOpen(true)}
                        size="lg"
                      >
                        Sign in to judge
                      </Button>
                    </SignedOut>
                  </>
                )}

                {actionMessage ? (
                  <div className="rounded-[1.5rem] border border-[rgb(204_63_79_/_0.25)] bg-[rgb(204_63_79_/_0.08)] p-4 text-sm text-foreground">
                    {actionMessage}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="glass-panel rounded-[1.8rem] p-5">
            <div className="eyebrow">Public board</div>
            <h3 className="mt-2 font-display text-2xl font-black">Everyone sees the same ranking</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              The main route is always public and read-only, so people can follow the standings without signing in.
            </p>
          </div>
          <div className="glass-panel rounded-[1.8rem] p-5">
            <div className="eyebrow">Judge flow</div>
            <h3 className="mt-2 font-display text-2xl font-black">One vote, then it locks</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Judges open a project row, score it once in the modal, and the board immediately reflects the new aggregate.
            </p>
          </div>
          <div className="glass-panel rounded-[1.8rem] p-5">
            <div className="eyebrow">Completion</div>
            <h3 className="mt-2 font-display text-2xl font-black">Finalize only when coverage is complete</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              The round can close only after every participating judge has scored every project they are eligible to judge.
            </p>
          </div>
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
