"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Search, FileText, Eye, Download, Trash2, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { generatePdfReport } from "@/lib/report-generator"

interface PatientRecord {
  id: string
  patientInfo: {
    id: string
    name: string
    age?: string
    gender?: string
  }
  date: string
  results: any
  image: string
}

export function PatientHistory() {
  const [records, setRecords] = useState<PatientRecord[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBy, setFilterBy] = useState<"all" | "pneumonia" | "normal">("all")
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Load reports from localStorage
    try {
      const savedReports = localStorage.getItem("reportHistory")
      if (savedReports) {
        const parsedReports = JSON.parse(savedReports)
        // Group by patient ID
        const patientRecords = parsedReports.reduce((acc: PatientRecord[], report: any) => {
          if (report.patientInfo && report.patientInfo.id) {
            acc.push(report)
          }
          return acc
        }, [])
        setRecords(patientRecords)
      }
    } catch (error) {
      console.error("Failed to load patient records:", error)
    }
  }, [])

  const filteredRecords = records.filter((record) => {
    const searchMatch =
      record.patientInfo.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.patientInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.patientInfo.age && record.patientInfo.age.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (record.results.predicted_class &&
        record.results.predicted_class.toLowerCase().includes(searchTerm.toLowerCase()))

    if (!searchMatch) return false

    if (filterBy === "pneumonia") {
      return record.results.predicted_class === "PNEUMONIA"
    } else if (filterBy === "normal") {
      return record.results.predicted_class === "NORMAL"
    }

    return true
  })

  const handleViewRecord = (record: PatientRecord) => {
    // Store the record data in localStorage
    localStorage.setItem("analysisResults", JSON.stringify(record.results))
    localStorage.setItem("uploadedImage", record.image)

    // Navigate to the results page
    router.push("/dashboard/results")
  }

  const handleGenerateReport = async (record: PatientRecord) => {
    setIsGeneratingReport(true)

    try {
      const predictionScore =
        record.results.predicted_class === "PNEUMONIA" ? record.results.prediction : 1 - record.results.prediction

      await generatePdfReport({
        patientInfo: {
          id: record.patientInfo.id,
          name: record.patientInfo.name,
          date: format(new Date(record.date), "dd/MM/yyyy"),
          age: record.patientInfo.age,
          gender: record.patientInfo.gender,
        },
        results: {
          prediction: predictionScore,
          predictedClass: record.results.predicted_class || "Unknown",
          confidence: (predictionScore * 100).toFixed(1) + "%",
        },
        imageUrl: record.image,
        heatmapUrl: record.results.gradcam_image ? `data:image/jpeg;base64,${record.results.gradcam_image}` : null,
      })
    } catch (error) {
      console.error("Failed to generate report:", error)
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const handleDeleteRecord = (id: string) => {
    try {
      const savedReports = localStorage.getItem("reportHistory")
      if (savedReports) {
        const parsedReports = JSON.parse(savedReports)
        const updatedReports = parsedReports.filter((report: any) => report.id !== id)
        localStorage.setItem("reportHistory", JSON.stringify(updatedReports))
        setRecords(records.filter((record) => record.id !== id))
      }
    } catch (error) {
      console.error("Failed to delete record:", error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient History</CardTitle>
        <CardDescription>View and manage patient examination history</CardDescription>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center">
            <Search className="h-4 w-4 mr-2 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter: {filterBy === "all" ? "All" : filterBy === "pneumonia" ? "Pneumonia" : "Normal"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterBy("all")}>All</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterBy("pneumonia")}>Pneumonia</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterBy("normal")}>Normal</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No patient records found</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              {searchTerm || filterBy !== "all"
                ? "Try adjusting your search or filter criteria"
                : "When you analyze X-ray images with patient information, they will appear here."}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Patient ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Age/Gender</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => {
                  const predictionScore =
                    record.results.predicted_class === "PNEUMONIA"
                      ? record.results.prediction
                      : 1 - record.results.prediction

                  return (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{format(new Date(record.date), "PPP")}</TableCell>
                      <TableCell>{record.patientInfo.id}</TableCell>
                      <TableCell>{record.patientInfo.name}</TableCell>
                      <TableCell>
                        {record.patientInfo.age && record.patientInfo.gender
                          ? `${record.patientInfo.age} / ${record.patientInfo.gender}`
                          : record.patientInfo.age || record.patientInfo.gender || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={record.results.predicted_class === "PNEUMONIA" ? "destructive" : "success"}>
                          {record.results.predicted_class || "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>{(predictionScore * 100).toFixed(1)}%</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleViewRecord(record)}
                            title="View Record"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleGenerateReport(record)}
                            disabled={isGeneratingReport}
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteRecord(record.id)}
                            title="Delete Record"
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
        )}
      </CardContent>
    </Card>
  )
}
