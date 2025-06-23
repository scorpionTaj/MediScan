import { ResultsPanel } from "@/components/dashboard/results-panel";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function ResultsPage() {
  return (
    <DashboardShell>
      <ResultsPanel />
    </DashboardShell>
  );
}
