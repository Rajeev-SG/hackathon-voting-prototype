"use client";

import * as React from "react";
import Link from "next/link";
import { Eye, ImagePlus, Info, Link2, Lightbulb, Pencil, Trash2 } from "lucide-react";

import type { AssetDraft, Project } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export function AssetUploadWorkspace({
  draft,
  project
}: {
  draft: AssetDraft;
  project: Project;
}) {
  const screenshotPool = React.useRef([
    ...project.gallery,
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80"
  ]);
  const [heroImage, setHeroImage] = React.useState(draft.hasHeroImage ? project.heroImage : "");
  const [videoDemo, setVideoDemo] = React.useState(draft.videoDemo);
  const [screenshots, setScreenshots] = React.useState(draft.screenshots);

  const heroReadiness = heroImage ? 100 : 25;
  const demoReadiness = Math.min(100, Math.round((screenshots.length / 3) * 100));

  const handleAddScreenshot = () => {
    const next = screenshotPool.current.find((item) => !screenshots.includes(item));
    if (!next || screenshots.length >= 6) return;
    setScreenshots((current) => [...current, next]);
    console.log("Added screenshot", next);
  };

  return (
    <main className="container flex flex-1 overflow-hidden py-8">
      <section className="flex-1 space-y-10 pr-0 xl:pr-10">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/projects" className="hover:text-primary">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-foreground">Visual Excellence</span>
        </nav>

        <header className="space-y-3">
          <div className="eyebrow">Submission Polish</div>
          <h1 className="section-heading">Visual Excellence</h1>
          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            First impressions drive comprehension. This workspace helps participants shape the exact material judges will
            see during scoring.
          </p>
        </header>

        <div className="space-y-12">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-2xl font-bold">Hero Image</h2>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
              <Badge variant="secondary">Required</Badge>
            </div>
            <button
              className="flex h-[220px] w-full flex-col items-center justify-center gap-4 rounded-[2rem] border border-dashed border-radix-teal-a-5 bg-radix-teal-a-3 px-6 text-center transition-colors hover:border-primary"
              onClick={() => {
                const nextValue = heroImage ? "" : project.heroImage;
                setHeroImage(nextValue);
                console.log("Hero image toggled", Boolean(nextValue));
              }}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-radix-teal-a-4 text-primary">
                <ImagePlus className="h-7 w-7" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Click to upload or drag and drop</p>
                <p className="text-sm text-muted-foreground">PNG, JPG or WebP (max 5MB)</p>
              </div>
            </button>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl font-bold">Video Demo</h2>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="relative">
              <Link2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-14 rounded-[1.4rem] pl-11"
                value={videoDemo}
                onChange={(event) => setVideoDemo(event.target.value)}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-2xl font-bold">Screenshot Gallery</h2>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-sm italic text-muted-foreground">{screenshots.length} / 6 uploaded</div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <button
                className="flex aspect-video items-center justify-center rounded-[1.5rem] border border-dashed border-radix-teal-a-5 bg-radix-teal-a-3 text-primary transition-colors hover:border-primary"
                onClick={handleAddScreenshot}
              >
                <ImagePlus className="h-7 w-7" />
              </button>

              {screenshots.map((image) => (
                <div key={image} className="group relative aspect-video overflow-hidden rounded-[1.5rem] border border-border">
                  <img alt="Uploaded screenshot preview" className="h-full w-full object-cover" src={image} />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => console.log("Edit screenshot", image)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => {
                        setScreenshots((current) => current.filter((item) => item !== image));
                        console.log("Deleted screenshot", image);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>

      <aside className="hidden w-[390px] flex-col border-l border-border bg-radix-gray-a-2 xl:flex">
        <div className="border-b border-border px-6 py-6">
          <div className="mb-1 flex items-center gap-2 font-display text-lg font-bold">
            <Eye className="h-4 w-4 text-primary" />
            Judge&apos;s View
          </div>
          <p className="text-sm text-muted-foreground">This is how your project appears to reviewers.</p>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          <div className="overflow-hidden rounded-[1.75rem] border border-border bg-radix-teal-a-3">
            <div className="aspect-video overflow-hidden border-b border-border">
              {heroImage ? (
                <img alt={`${project.name} hero preview`} className="h-full w-full object-cover" src={heroImage} />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Skeleton className="h-full w-full rounded-none" />
                </div>
              )}
            </div>
            <div className="space-y-4 p-4">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 4 }).map((_, index) =>
                  screenshots[index] ? (
                    <img
                      key={screenshots[index]}
                      alt="Judge preview screenshot"
                      className="aspect-square rounded-xl object-cover"
                      src={screenshots[index]}
                    />
                  ) : (
                    <Skeleton key={index} className="aspect-square rounded-xl" />
                  )
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="eyebrow">Visual Readiness</div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Hero Presence</span>
                <span className="font-medium text-foreground">{heroImage ? "Ready" : "Pending"}</span>
              </div>
              <Progress value={heroReadiness} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Demo Depth</span>
                <span className="font-medium text-primary">{screenshots.length >= 3 ? "Good" : "Building"}</span>
              </div>
              <Progress value={demoReadiness} />
            </div>
          </div>

          <Alert>
            <AlertTitle className="flex items-center gap-2 text-xs uppercase tracking-[0.2em]">
              <Lightbulb className="h-4 w-4" />
              Judge&apos;s Tip
            </AlertTitle>
            <AlertDescription className="mt-2 italic text-muted-foreground">{draft.readinessTip}</AlertDescription>
          </Alert>
        </div>

        <div className="border-t border-border p-6">
          <Button
            variant="outline"
            className="w-full rounded-2xl"
            onClick={() => console.log("Open live preview", { heroImage, videoDemo, screenshots })}
          >
            Live Preview Link
          </Button>
        </div>
      </aside>
    </main>
  );
}
