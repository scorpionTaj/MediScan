import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { UploadPanel } from "@/components/dashboard/upload-panel";

export default function DashboardPage() {
  return (
    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
      <DashboardShell>
        <UploadPanel />
      </DashboardShell>
    </div>
  );
}
