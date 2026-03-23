import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, CircleDot } from "lucide-react";

import type { Project } from "@/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

function projectStatusMeta(project: Project) {
  if (project.status === "scored") {
    return {
      icon: CheckCircle2,
      tone: "text-radix-teal-11",
      label: "Scored"
    };
  }

  if (project.status === "in-progress") {
    return {
      icon: Clock3,
      tone: "text-amber-400",
      label: "In Progress"
    };
  }

  return {
    icon: CircleDot,
    tone: "text-muted-foreground",
    label: "Not Started"
  };
}

function actionCopy(project: Project) {
  if (project.status === "scored") {
    return { label: "View Details", href: `/projects/${project.slug}` };
  }

  if (project.status === "in-progress") {
    return { label: "Continue Judging", href: `/projects/${project.slug}/score` };
  }

  return { label: "Start Judging", href: `/projects/${project.slug}/score` };
}

export function ProjectCard({
  project,
  view = "grid"
}: {
  project: Project;
  view?: "grid" | "list";
}) {
  const status = projectStatusMeta(project);
  const action = actionCopy(project);
  const StatusIcon = status.icon;
  const detailHref = `/projects/${project.slug}`;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-radix-teal-a-4 transition-transform duration-300 hover:-translate-y-1",
        view === "list" && "grid grid-cols-[260px_1fr] items-stretch"
      )}
    >
      <Link
        aria-label={`Open ${project.name}`}
        className="absolute inset-0 z-10"
        href={detailHref}
      />
      <div className={cn("relative overflow-hidden", view === "grid" ? "h-52" : "h-full min-h-[240px]")}>
        <img
          alt={`${project.name} project cover`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          src={project.heroImage}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.55)_100%)]" />
        <Badge className="absolute right-4 top-4 bg-radix-gray-a-4 text-foreground">{project.booth}</Badge>
      </div>

      <CardContent className="relative z-20 flex h-full flex-col gap-5 p-5">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{project.track}</Badge>
              </div>
              <h3 className="font-display text-2xl font-bold">{project.name}</h3>
              <p className="text-sm text-muted-foreground">By {project.teamName}</p>
            </div>
            <div className={cn("flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.2em]", status.tone)}>
              <StatusIcon className="h-3.5 w-3.5" />
              {status.label}
            </div>
          </div>
          <p className="text-sm leading-7 text-muted-foreground">{project.pitch}</p>
          <div className="flex flex-wrap gap-2">
            {project.techStack.slice(0, 4).map((stack) => (
              <Badge key={stack} variant="outline" className="normal-case tracking-normal text-xs">
                {stack}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between gap-4 border-t border-border pt-5">
          {project.status === "scored" ? (
            <div>
              <div className="eyebrow">Score</div>
              <div className="font-display text-3xl font-black text-primary">
                {project.score.toFixed(1)}
                <span className="ml-1 text-sm font-medium text-muted-foreground">/ 100</span>
              </div>
            </div>
          ) : (
            <div className="min-w-[140px]">
              <div className="eyebrow">Progress</div>
              <Progress className="mt-3 h-1.5" value={project.judgingProgress} />
            </div>
          )}

          <Button
            asChild
            variant={project.status === "scored" ? "outline" : "default"}
            className="relative z-30 rounded-2xl"
          >
            <Link href={action.href}>
              {action.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
