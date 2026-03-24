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
import { ResultsScoreboardTable } from "@/components/results-scoreboard-table";
import { ThemeToggle } from "@/components/theme-toggle";
import { VoteDialog } from "@/components/vote-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

function statusCopy(status: CompetitionSnapshot["status"]) {
  if (status === "PREPARING") {
    return {
      eyebrow: "Manager setup",
      body:
        "Upload the judging workbook, review the entries, and open the round when the judges are ready."
    };
  }

  if (status === "OPEN") {
    return {
      eyebrow: "Judging live",
      body:
        "Everyone can watch the aggregate scores move in real time while authenticated judges score projects one by one."
    };
  }

  return {
    eyebrow: "Finalized",
    body:
      "Judging is complete. The public scoreboard is now final, and the manager can export the official results workbook."
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
  const isEmpty = snapshot.entries.length === 0;
  const autoRefreshIntervalMs = snapshot.status === "OPEN" ? 5000 : 15000;
  const autoRefreshPaused =
    Boolean(selectedEntry) ||
    authDialogOpen ||
    uploadState.status === "uploading" ||
    pendingAction;

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

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
          <div className="glass-panel shell-surface content-grid overflow-hidden rounded-[2rem] px-6 py-7">
            <div className="eyebrow">{copy.eyebrow}</div>
            <h1 className="section-heading mt-3">Hackathon scoreboard</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground">{copy.body}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="rounded-full bg-radix-teal-a-4 px-4 py-2 text-sm font-semibold text-accent-foreground">
                Public read-only scoreboard
              </div>
              <div className="rounded-full bg-radix-purple-a-4 px-4 py-2 text-sm font-semibold text-foreground">
                Manager: {snapshot.managerEmail}
              </div>
              <div className="rounded-full bg-radix-gray-a-3 px-4 py-2 text-sm font-semibold text-muted-foreground">
                Self-vote blocking from uploaded team emails
              </div>
            </div>
          </div>

          <Card className="glass-panel rounded-[2rem] border-0 bg-transparent shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Judging progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-3">
                <div className="font-display text-5xl font-black text-primary">{snapshot.progress.percentage}%</div>
                <div className="pb-2 text-sm font-semibold text-muted-foreground">
                  {snapshot.progress.castVotes}/
                  {snapshot.progress.expectedVotes || snapshot.progress.entryCount}
                </div>
              </div>
              <Progress value={snapshot.progress.percentage} />
              <p className="text-sm leading-7 text-muted-foreground">{snapshot.progress.helperText}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Board refreshes automatically every {Math.round(autoRefreshIntervalMs / 1000)} seconds while this tab is active.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.5rem] bg-radix-gray-a-3 p-4">
                  <div className="eyebrow">Entries</div>
                  <div className="mt-2 font-display text-2xl font-black">{snapshot.progress.entryCount}</div>
                </div>
                <div className="rounded-[1.5rem] bg-radix-gray-a-3 p-4">
                  <div className="eyebrow">Judges in round</div>
                  <div className="mt-2 font-display text-2xl font-black">
                    {snapshot.progress.participatingJudgeCount}
                  </div>
                </div>
                <div className="rounded-[1.5rem] bg-radix-gray-a-3 p-4">
                  <div className="eyebrow">State</div>
                  <div className="mt-2 font-display text-2xl font-black">{snapshot.status}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="eyebrow">Scoreboard</div>
                <h2 className="font-display text-2xl font-black">
                  {isEmpty ? "Upload once, then the board comes alive" : "Every project, one board"}
                </h2>
              </div>
              <div className="text-sm text-muted-foreground">
                {isEmpty
                  ? "No placeholder projects are shown. The board stays empty until the manager uploads the workbook."
                  : "Click any row to vote or review why that project is locked."}
              </div>
            </div>
            <ResultsScoreboardTable
              entries={snapshot.entries}
              onSelectEntry={setSelectedEntry}
              status={snapshot.status}
              viewer={snapshot.viewer}
            />
          </div>

          <div className="space-y-4">
            <Card className="glass-panel rounded-[2rem] border-0 bg-transparent shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {snapshot.viewer.isManager ? "Manager controls" : "How judging works"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {snapshot.viewer.isManager ? (
                  <>
                    <div className="rounded-[1.5rem] border border-border bg-radix-gray-a-3 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <FileSpreadsheet className="h-4 w-4 text-primary" />
                        XLSX workflow
                      </div>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        Download the template, fill one row per project, keep project names unique, and include at least one team email per row. The live board is driven entirely by what you upload here.
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
                      <div className="rounded-[1.5rem] border border-border bg-radix-gray-a-3 p-4 text-sm leading-7 text-muted-foreground">
                        No workbook is loaded right now. Download the blank template, fill it in, and upload it here to populate the board.
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
                  </>
                ) : (
                  <>
                    <div className="rounded-[1.5rem] border border-border bg-radix-gray-a-3 p-4 text-sm leading-7 text-muted-foreground">
                      Anyone can view the board. Judges sign in once, cast one score per project from the modal, and that score stays locked unless the manager resets the whole round.
                    </div>
                    <div className="rounded-[1.5rem] border border-border bg-radix-gray-a-3 p-4 text-sm leading-7 text-muted-foreground">
                      A judge joins the progress denominator the moment they cast their first vote. Completion means every participating judge has scored every entry.
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
