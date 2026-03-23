import { projects } from "@/lib/mock-data";
import { ProjectDirectory } from "@/components/project-directory";

export default function ProjectsPage() {
  return <ProjectDirectory projects={projects} />;
}
