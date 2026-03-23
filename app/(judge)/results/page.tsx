import { ResultsDashboard } from "@/components/results-dashboard";
import { scoreboard, tieBreakCases } from "@/lib/mock-data";

export default function ResultsPage() {
  return <ResultsDashboard scoreboard={scoreboard} tieBreaks={tieBreakCases} />;
}
