import { notFound } from "next/navigation";

import { getProjectBySlug, rubricCriteria } from "@/lib/mock-data";
import { ScoringWorkbench } from "@/components/scoring-workbench";

export default function ScorePage({ params }: { params: { slug: string } }) {
  const project = getProjectBySlug(params.slug);

  if (!project) {
    notFound();
  }

  return <ScoringWorkbench project={project} rubric={rubricCriteria} />;
}
