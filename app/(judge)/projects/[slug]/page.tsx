import { notFound } from "next/navigation";

import { getProjectBySlug } from "@/lib/mock-data";
import { ProjectOverview } from "@/components/project-overview";

export default function ProjectDetailPage({ params }: { params: { slug: string } }) {
  const project = getProjectBySlug(params.slug);

  if (!project) {
    notFound();
  }

  return <ProjectOverview project={project} />;
}
