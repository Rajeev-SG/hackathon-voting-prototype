"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, CheckCircle2 } from "lucide-react";

import type { Project, RubricCriterion } from "@/types";
import { quickNotes } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function ScoringWorkbench({
  project,
  rubric
}: {
  project: Project;
  rubric: RubricCriterion[];
}) {
  const [scores, setScores] = React.useState<Record<string, string>>(
    Object.fromEntries(rubric.map((criterion) => [criterion.id, criterion.defaultScore]))
  );
  const [noteInput, setNoteInput] = React.useState("");
  const [chipNotes, setChipNotes] = React.useState<string[]>([]);
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>(
    Object.fromEntries(rubric.map((criterion, index) => [criterion.id, index === 0]))
  );

  const answeredCount = Object.values(scores).filter(Boolean).length;
  const progressValue = Math.round((answeredCount / rubric.length) * 100);
  const judgingCount = Math.round((project.judgingProgress / 100) * 40);
  const mergedNotes = [noteInput.trim(), ...chipNotes].filter(Boolean).join(" · ");

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,var(--gray-1)_0%,var(--gray-2)_100%)]">
      <nav className="sticky top-0 z-40 border-b border-border bg-radix-gray-a-2 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="icon">
              <Link href={`/projects/${project.slug}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <p className="font-display text-sm font-bold">{project.name}</p>
              <p className="text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground">
                {project.booth} / {project.teamName}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-radix-teal-10" />
            Synced
          </Badge>
        </div>
      </nav>

      <main className="container flex flex-col gap-10 py-8 pb-36">
        <section className="space-y-5">
          <p className="max-w-3xl text-2xl font-medium leading-9 text-foreground">{project.summary}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{project.track}</Badge>
            {project.techStack.slice(0, 2).map((item) => (
              <Badge key={item} variant="outline" className="normal-case tracking-normal text-xs">
                {item}
              </Badge>
            ))}
            <Badge variant="outline" className="normal-case tracking-normal text-xs">
              Prototype
            </Badge>
          </div>
        </section>

        <section className="space-y-6">
          {rubric.map((criterion) => (
            <Card key={criterion.id}>
              <CardHeader>
                <CardTitle>{criterion.title}</CardTitle>
                <CardDescription>{criterion.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="mb-3 flex items-center justify-between text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    <span>Not evident</span>
                    <span>Exceptional</span>
                  </div>
                  <ToggleGroup
                    className="grid grid-cols-5 gap-2"
                    type="single"
                    value={scores[criterion.id]}
                    onValueChange={(value) => {
                      if (!value) return;
                      setScores((current) => ({ ...current, [criterion.id]: value }));
                    }}
                  >
                    {["1", "2", "3", "4", "5"].map((score) => (
                      <ToggleGroupItem key={score} value={score} size="lg" className="w-full rounded-2xl">
                        {score}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>

                <Collapsible
                  open={expanded[criterion.id]}
                  onOpenChange={(open) => setExpanded((current) => ({ ...current, [criterion.id]: open }))}
                >
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-primary">
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${expanded[criterion.id] ? "rotate-180" : ""}`}
                      />
                      What good looks like
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4 border-l border-border pl-6 text-sm leading-7 text-muted-foreground">
                    {criterion.benchmark}
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="space-y-4 pb-6">
          <div className="eyebrow">Qualitative Feedback</div>
          <Input
            className="rounded-none border-0 border-b border-border bg-transparent px-0 focus-visible:ring-0"
            placeholder="Add note..."
            value={noteInput}
            onChange={(event) => setNoteInput(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {quickNotes.map((note) => (
              <Button
                key={note}
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() =>
                  setChipNotes((current) =>
                    current.includes(note) ? current.filter((item) => item !== note) : [...current, note]
                  )
                }
              >
                {note}
              </Button>
            ))}
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-radix-gray-a-2 backdrop-blur-xl">
        <div className="container flex items-center justify-between gap-4 py-4">
          <div className="min-w-[140px]">
            <div className="mb-2 flex items-center gap-3">
              <Progress className="h-1.5 max-w-[120px]" value={progressValue} />
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {judgingCount}/40
              </span>
            </div>
            <div className="eyebrow">Judging Progress</div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() =>
                console.log("Parked draft", {
                  project: project.slug,
                  scores,
                  notes: mergedNotes
                })
              }
            >
              Park
            </Button>
            <Button
              onClick={() =>
                console.log("Submitted score", {
                  project: project.slug,
                  scores,
                  notes: mergedNotes
                })
              }
            >
              Submit Score
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
