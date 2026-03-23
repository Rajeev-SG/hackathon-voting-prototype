"use client";

import * as React from "react";
import Link from "next/link";
import { Grid2x2, List, Search, Upload } from "lucide-react";

import type { Project } from "@/types";
import { filterOptions } from "@/lib/mock-data";
import { ProjectCard } from "@/components/project-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

function matchesStatus(project: Project, status: string) {
  if (status === "all") return true;
  if (status === "not-started") return project.status === "not-started";
  if (status === "in-progress") return project.status === "in-progress";
  if (status === "scored") return project.status === "scored";
  return true;
}

export function ProjectDirectory({ projects }: { projects: Project[] }) {
  const [query, setQuery] = React.useState("");
  const [track, setTrack] = React.useState("All Tracks");
  const [stack, setStack] = React.useState("All Stacks");
  const [status, setStatus] = React.useState("all");
  const [view, setView] = React.useState("grid");
  const [page, setPage] = React.useState(1);
  const [isPending, startTransition] = React.useTransition();
  const deferredQuery = React.useDeferredValue(query);
  const perPage = view === "grid" ? 4 : 5;

  const filteredProjects = projects.filter((project) => {
    const target = `${project.name} ${project.teamName} ${project.track} ${project.techStack.join(" ")} ${project.booth}`.toLowerCase();
    const queryMatch = target.includes(deferredQuery.trim().toLowerCase());
    const trackMatch = track === "All Tracks" || project.track === track;
    const stackMatch = stack === "All Stacks" || project.techStack.includes(stack);
    const statusMatch = matchesStatus(project, status);
    return queryMatch && trackMatch && stackMatch && statusMatch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pagedProjects = filteredProjects.slice((safePage - 1) * perPage, safePage * perPage);

  return (
    <main className="container flex flex-col gap-8 py-10">
      <section className="content-grid overflow-hidden rounded-[2rem] border border-border px-6 py-8 shadow-panel">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="space-y-3">
            <div className="eyebrow">Judge Workspace</div>
            <h1 className="section-heading">Project Directory</h1>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground">
              Evaluate and score 42 assigned submissions across all tracks. Filters, progress, and routing stay live so
              judges can move without losing context.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/submission/assets">
                <Upload className="h-4 w-4" />
                Upload Assets
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-[2rem] p-4 sm:p-6">
        <div className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-14 rounded-[1.4rem] pl-11"
              placeholder="Search projects by name, team, tech stack, or booth number..."
              value={query}
              onChange={(event) => {
                const nextQuery = event.target.value;
                startTransition(() => {
                  setQuery(nextQuery);
                  setPage(1);
                });
              }}
            />
          </div>

          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline">Filters</Badge>
              <Select
                value={track}
                onValueChange={(value) =>
                  startTransition(() => {
                    setTrack(value);
                    setPage(1);
                  })
                }
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.tracks.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={stack}
                onValueChange={(value) =>
                  startTransition(() => {
                    setStack(value);
                    setPage(1);
                  })
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.stacks.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {isPending ? <span className="text-sm text-muted-foreground">Updating view…</span> : null}
            </div>

            <ToggleGroup
              type="single"
              value={view}
              onValueChange={(value) => {
                if (!value) return;
                startTransition(() => {
                  setView(value);
                  setPage(1);
                });
              }}
            >
              <ToggleGroupItem value="grid" aria-label="Grid view">
                <Grid2x2 className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </section>

      <Tabs value={status} onValueChange={setStatus} className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <TabsList className="h-auto rounded-[1.25rem] bg-transparent p-0">
            <TabsTrigger value="all" className="rounded-full border border-transparent data-[state=active]:border-radix-teal-a-5">
              All Projects
            </TabsTrigger>
            <TabsTrigger value="not-started" className="rounded-full border border-transparent data-[state=active]:border-radix-teal-a-5">
              Not Started
            </TabsTrigger>
            <TabsTrigger value="in-progress" className="rounded-full border border-transparent data-[state=active]:border-radix-teal-a-5">
              In Progress
            </TabsTrigger>
            <TabsTrigger value="scored" className="rounded-full border border-transparent data-[state=active]:border-radix-teal-a-5">
              Scored
            </TabsTrigger>
          </TabsList>

          <div className="text-sm text-muted-foreground">
            Showing {pagedProjects.length} of {filteredProjects.length} matching projects
          </div>
        </div>

        <TabsContent value={status} className="space-y-8">
          <div className={view === "grid" ? "grid gap-6 md:grid-cols-2" : "flex flex-col gap-5"}>
            {pagedProjects.map((project) => (
              <ProjectCard key={project.slug} project={project} view={view as "grid" | "list"} />
            ))}
          </div>

          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <div className="eyebrow">Completed</div>
                <div className="font-display text-3xl font-black text-primary">12/42</div>
              </div>
              <div>
                <div className="eyebrow">Average Score</div>
                <div className="font-display text-3xl font-black text-primary">8.4</div>
              </div>
              <div>
                <div className="eyebrow">Fast Path</div>
                <Link href="/results" className="text-sm font-semibold text-primary hover:underline">
                  Open results board
                </Link>
              </div>
            </div>

            <Pagination className="justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    disabled={safePage <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink isActive={pageNumber === safePage} onClick={() => setPage(pageNumber)}>
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
