"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Download, Eye, FileText, Bell, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { generatePdfReport } from "@/lib/report-generator"
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from "@/components/ui/modal"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import {
  checkNotificationPermission,
  requestNotificationPermission,
  sendReportNotification,
} from "@/lib/notification-service"

interface Report {
  id: string
  date: string
  results: any
  image: string
  patientInfo: {
    id: string
    name: string
    email?: string
  }
}

export function ReportsPanel() {
  const [reports, setReports] = useState<Report[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [notificationModalOpen, setNotificationModalOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [notificationPermission, setNotificationPermission] = useState<string>("default")
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Load reports from localStorage
    try {
      const savedReports = localStorage.getItem("reportHistory")
      if (savedReports) {
        setReports(JSON.parse(savedReports))
      }
    } catch (error) {
      console.error("Failed to load reports:", error)
    }

    // Check notification permission
    setNotificationPermission(checkNotificationPermission())
  }, [])

  const filteredReports = reports.filter((report) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      report.patientInfo.id.toLowerCase().includes(searchLower) ||
      report.patientInfo.name.toLowerCase().includes(searchLower) ||
      report.results.predicted_class?.toLowerCase().includes(searchLower) ||
      format(new Date(report.date), "PPP").toLowerCase().includes(searchLower)
    )
  })

  const handleViewReport = (report: Report) => {
    // Store the report data in localStorage
    localStorage.setItem("analysisResults", JSON.stringify(report.results))
    localStorage.setItem("uploadedImage", report.image)

    // Navigate to the results page
    router.push("/dashboard/results")
  }

  const handleGenerateReport = async (report: Report) => {
    setIsGeneratingReport(true)

    try {
      const predictionScore =
        report.results.predicted_class === "PNEUMONIA" ? report.results.prediction : 1 - report.results.prediction

      await generatePdfReport({
        patientInfo: {
          id: report.patientInfo.id,
          name: report.patientInfo.name,
          date: format(new Date(report.date), "dd/MM/yyyy"),
        },
        results: {
          prediction: predictionScore,
          predictedClass: report.results.predicted_class || "Unknown",
          confidence: (predictionScore * 100).toFixed(1) + "%",
        },
        imageUrl: report.image,
        heatmapUrl: report.results.gradcam_image ? `data:image/jpeg;base64,${report.results.gradcam_image}` : null,
      })
    } catch (error) {
      console.error("Failed to generate report:", error)
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const handleDeleteReport = (id: string) => {
    const updatedReports = reports.filter((report) => report.id !== id)
    setReports(updatedReports)
    localStorage.setItem("reportHistory", JSON.stringify(updatedReports))
  }

  const handleOpenNotificationModal = (report: Report) => {
    setSelectedReport(report)
    setNotificationModalOpen(true)
  }

  const handleSendNotification = async () => {
    if (!selectedReport) return

    // Request notification permission if not already granted
    if (notificationPermission !== "granted") {
      const granted = await requestNotificationPermission()
      setNotificationPermission(granted ? "granted" : "denied")

      if (!granted) {
        toast({
          title: "Notification Permission Denied",
          description: "Please enable notifications in your browser settings to receive report notifications.",
          variant: "destructive",
        })
        setNotificationModalOpen(false)
        return
      }
    }

    // Send the notification
    const success = sendReportNotification(selectedReport.patientInfo.name, selectedReport.results.predicted_class)

    if (success) {
      toast({
        title: "Notification Sent",
        description: "Report notification has been sent successfully.",
        duration: 5000,
      })
    } else {
      toast({
        title: "Notification Failed",
        description: "Failed to send notification. Please check browser permissions.",
        variant: "destructive",
      })
    }

    setNotificationModalOpen(false)
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No reports found</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              When you analyze X-ray images, your reports will appear here for easy access and reference.
            </p>
            <Button className="mt-6" onClick={() => router.push("/dashboard")}>
              Upload X-Ray
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>X-Ray Analysis Reports</CardTitle>
        <CardDescription>View and manage your previous X-ray analysis reports</CardDescription>
        <div className="flex items-center mt-4">
          <Search className="h-4 w-4 mr-2 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Patient ID</TableHead>
                <TableHead>Patient Name</TableHead>
                <TableHead>Diagnosis</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => {
                const predictionScore =
                  report.results.predicted_class === "PNEUMONIA"
                    ? report.results.prediction
                    : 1 - report.results.prediction

                return (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{format(new Date(report.date), "PPP")}</TableCell>
                    <TableCell>{report.patientInfo.id}</TableCell>
                    <TableCell>{report.patientInfo.name}</TableCell>
                    <TableCell>
                      <Badge variant={report.results.predicted_class === "PNEUMONIA" ? "destructive" : "success"}>
                        {report.results.predicted_class || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>{(predictionScore * 100).toFixed(1)}%</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleViewReport(report)}
                          title="View Report"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleGenerateReport(report)}
                          disabled={isGeneratingReport}
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleOpenNotificationModal(report)}
                          title="Send Notification"
                        >
                          <Bell className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteReport(report.id)}
                          title="Delete Report"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Notification Modal */}
      <Modal open={notificationModalOpen} onOpenChange={setNotificationModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Send Report Notification</ModalTitle>
            <ModalDescription>Send a browser notification for this report</ModalDescription>
          </ModalHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-right">
                <Label>Patient</Label>
              </div>
              <div className="col-span-3">
                <p className="text-sm">{selectedReport?.patientInfo.name}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-right">
                <Label>Diagnosis</Label>
              </div>
              <div className="col-span-3">
                <Badge variant={selectedReport?.results.predicted_class === "PNEUMONIA" ? "destructive" : "success"}>
                  {selectedReport?.results.predicted_class || "Unknown"}
                </Badge>
              </div>
            </div>
            {notificationPermission === "denied" && (
              <div className="col-span-4 bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                Notifications are blocked. Please enable notifications in your browser settings.
              </div>
            )}
          </div>
          <ModalFooter>
            <Button variant="outline" onClick={() => setNotificationModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendNotification}>
              <Bell className="h-4 w-4 mr-2" />
              Send Notification
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  )
}
