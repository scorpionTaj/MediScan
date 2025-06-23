import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { BatchUploadPanel } from "@/components/dashboard/batch-upload"

export default function BatchPage() {
  return (
    <DashboardShell>
      <BatchUploadPanel />
    </DashboardShell>
  )
}
