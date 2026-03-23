import Link from "next/link";
import { ArrowLeft, Gavel, Github, PlayCircle, MapPinned, Users2, Waypoints } from "lucide-react";

import type { Project } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ProjectOverview({ project }: { project: Project }) {
  return (
    <main className="container space-y-10 py-10">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/projects">Projects</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="text-primary">{project.name}</span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="relative overflow-hidden rounded-[2.2rem] border border-border shadow-halo">
        <img alt={`${project.name} hero`} className="h-[420px] w-full object-cover" src={project.heroImage} />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.82)_100%)]" />
        <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-6 p-8 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <div className="eyebrow text-radix-teal-11">Project Spotlight</div>
            <h1 className="font-display text-5xl font-black tracking-tight text-white">{project.name}</h1>
            <p className="text-lg font-medium text-radix-teal-11">by {project.teamName}</p>
          </div>
          <Button asChild variant="outline" className="rounded-2xl bg-radix-gray-a-3 text-white">
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4" />
              Back to Directory
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_360px] lg:items-start">
        <div className="max-w-4xl border-l-4 border-primary pl-6">
          <p className="text-2xl font-light leading-10 text-muted-foreground">{project.pitch}</p>
        </div>
        <div className="flex lg:justify-stretch">
          <Button asChild className="w-full rounded-2xl lg:self-start">
            <Link href={`/projects/${project.slug}/score`}>
              <Gavel className="h-4 w-4" />
              Vote on Project
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_360px]">
        <div className="space-y-10">
          <div className="space-y-4">
            <div className="eyebrow">The Inspiration</div>
            <div className="space-y-5 text-base leading-8 text-muted-foreground">
              {project.description.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="eyebrow">Built With</div>
            <div className="flex flex-wrap gap-2">
              {project.techStack.map((stack) => (
                <Badge key={stack} variant="secondary" className="normal-case text-sm tracking-normal">
                  {stack}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button asChild variant="outline" className="rounded-2xl">
              <Link href={project.links.github}>
                <Github className="h-4 w-4" />
                View Code on GitHub
              </Link>
            </Button>
            <Button asChild className="rounded-2xl">
              <Link href={project.links.demo}>
                <PlayCircle className="h-4 w-4" />
                Launch Live Demo
              </Link>
            </Button>
          </div>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Project Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-radix-teal-a-4 text-primary">
                  <MapPinned className="h-4 w-4" />
                </div>
                <div>
                  <div className="eyebrow">Booth Number</div>
                  <p className="text-sm font-medium">{project.boothLocation}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-radix-teal-a-4 text-primary">
                  <Waypoints className="h-4 w-4" />
                </div>
                <div>
                  <div className="eyebrow">Hackathon Track</div>
                  <p className="text-sm font-medium">{project.track}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-radix-teal-a-4 text-primary">
                  <Users2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="eyebrow">Submission Status</div>
                  <Badge variant="secondary" className="mt-2">
                    {project.submissionStatus}
                  </Badge>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <div className="eyebrow">The Team</div>
                <div className="mt-4 space-y-4">
                  {project.team.map((member) => (
                    <div key={member.name} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage alt={member.name} src={member.avatar} />
                        <AvatarFallback>{member.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
  );
}
