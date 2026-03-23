"use client";

import * as React from "react";
import Link from "next/link";
import { BarChart3, Filter, Search } from "lucide-react";

import type { ScoreboardEntry, TieBreakCase } from "@/types";
import { getProjectBySlug } from "@/lib/mock-data";
import { ResultsScoreboardTable } from "@/components/results-scoreboard-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

export function ResultsDashboard({
  scoreboard,
  tieBreaks: _tieBreaks
}: {
  scoreboard: ScoreboardEntry[];
  tieBreaks: TieBreakCase[];
}) {
  const [query, setQuery] = React.useState("");
  const deferredQuery = React.useDeferredValue(query);

  const filteredEntries = scoreboard.filter((entry) => {
    const project = getProjectBySlug(entry.slug);
    if (!project) return false;
    const target = `${project.name} ${project.teamName} ${project.track}`.toLowerCase();
    return target.includes(deferredQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen">
      <main className="container space-y-10 py-8">
          <section className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-4">
              <div className="eyebrow">Final Review</div>
              <h1 className="section-heading">Scoreboard Summary</h1>
              <p className="text-base leading-8 text-muted-foreground">
                Review, search, and finalize your scores before locking the Main Track leaderboard.
              </p>
              <div className="flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="rounded-full pl-11"
                    placeholder="Search projects..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
                <Button asChild>
                  <Link href="/submission/assets">Upload Project</Link>
                </Button>
              </div>
            </div>
            <div className="flex w-full max-w-md flex-col gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Judging Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-end gap-2">
                    <div className="font-display text-4xl font-black text-primary">40/40</div>
                    <div className="pb-1 text-sm font-semibold text-primary">100%</div>
                  </div>
                  <Progress value={100} />
                  <p className="text-sm text-muted-foreground">
                    All projects submitted and ready for committee review.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h2 className="font-display text-2xl font-bold">Project Scoreboard</h2>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => console.log("Filter clicked")}>
                  <Filter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => console.log("Sort clicked")}>
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <ResultsScoreboardTable entries={filteredEntries} />
          </section>
      </main>
    </div>
  );
}
