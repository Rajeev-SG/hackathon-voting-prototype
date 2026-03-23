"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import type { ScoreboardEntry } from "@/types";
import { getProjectBySlug } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";

type ResultRow = ScoreboardEntry & {
  projectName: string;
  teamName: string;
  image: string;
};

function statusBadge(entry: ResultRow) {
  if (entry.status === "finalist") {
    return <Badge variant="secondary">Finalist</Badge>;
  }

  if (entry.status === "tied") {
    return <Badge variant="warning">{entry.label}</Badge>;
  }

  return (
    <Badge variant="outline" className="border-radix-purple-a-5 bg-radix-purple-a-4 text-radix-purple-11">
      Qualified
    </Badge>
  );
}

export function ResultsScoreboardTable({ entries }: { entries: ScoreboardEntry[] }) {
  const router = useRouter();
  const [page, setPage] = React.useState(1);
  const perPage = 5;

  const rows: ResultRow[] = entries
    .map((entry) => {
      const project = getProjectBySlug(entry.slug);
      if (!project) return null;
      return {
        ...entry,
        projectName: project.name,
        teamName: project.teamName,
        image: project.gallery[0] || project.heroImage
      };
    })
    .filter((row): row is ResultRow => Boolean(row));

  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
  const pagedRows = rows.slice((page - 1) * perPage, page * perPage);

  const columns: ColumnDef<ResultRow>[] = [
    {
      accessorKey: "rank",
      header: "Rank",
      cell: ({ row }) => (
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full font-display text-sm font-black ${
            row.original.status === "tied" ? "bg-amber-500/15 text-amber-400" : "bg-radix-teal-a-4 text-primary"
          }`}
        >
          {row.original.rank}
        </div>
      )
    },
    {
      accessorKey: "projectName",
      header: "Project Details",
      cell: ({ row }) => (
        <div className="flex items-center gap-4">
          <img
            alt={`${row.original.projectName} thumbnail`}
            className="h-12 w-12 rounded-2xl object-cover"
            src={row.original.image}
          />
          <div>
            <div className="font-semibold">{row.original.projectName}</div>
            <div className="text-xs text-muted-foreground">Team: {row.original.teamName}</div>
          </div>
        </div>
      )
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => statusBadge(row.original)
    },
    {
      accessorKey: "score",
      header: "Final Score",
      cell: ({ row }) => (
        <div className="font-display text-xl font-black">
          {row.original.score.toFixed(1)}
          <span className="ml-1 text-sm font-medium text-muted-foreground">/ 100</span>
        </div>
      )
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div
          className="flex justify-end"
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/projects/${row.original.slug}`}>View project</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/projects/${row.original.slug}/score`}>Open scorecard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log("Flag project", row.original.slug)}>
                Flag for committee
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={pagedRows}
        onRowClick={(row) => router.push(`/projects/${row.slug}`)}
      />
      <div className="flex flex-col gap-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>
          Showing {(page - 1) * perPage + 1}-{Math.min(page * perPage, rows.length)} of {rows.length} projects
        </p>
        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                disabled={page === 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <PaginationItem key={pageNumber}>
                <PaginationLink isActive={page === pageNumber} onClick={() => setPage(pageNumber)}>
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                disabled={page === totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
