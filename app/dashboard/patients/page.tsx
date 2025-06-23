import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { PatientHistory } from "@/components/dashboard/patient-history"

export default function PatientsPage() {
  return (
    <DashboardShell>
      <PatientHistory />
    </DashboardShell>
  )
}
