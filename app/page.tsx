import { ResultsDashboard } from "@/components/results-dashboard";
import { getCompetitionSnapshot } from "@/lib/competition";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const snapshot = await getCompetitionSnapshot();
  return <ResultsDashboard snapshot={snapshot} />;
}
