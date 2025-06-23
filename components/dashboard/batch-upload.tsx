"use client"

import type React from "react"

import { useState } from "react"
import { FileUp, Loader2, Upload, X, Eye, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { uploadXRay } from "@/lib/api-service"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface BatchResult {
  file: File
  preview: string
  status: "pending" | "processing" | "success" | "error"
  result?: any
}

export function BatchUploadPanel() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [batchResults, setBatchResults] = useState<BatchResult[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [useGradcam, setUseGradcam] = useState(true)
  const { toast } = useToast()

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter((file) => file.type.match("image.*"))

      if (newFiles.length === 0) {
        toast({
          title: "Invalid file type",
          description: "Please select image files only (JPEG, PNG, etc.)",
          variant: "destructive",
        })
        return
      }

      setSelectedFiles((prev) => [...prev, ...newFiles])

      // Create previews for the new files
      const newResults: BatchResult[] = newFiles.map((file) => {
        return {
          file,
          preview: URL.createObjectURL(file),
          status: "pending",
        }
      })

      setBatchResults((prev) => [...prev, ...newResults])
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    setBatchResults((prev) => prev.filter((_, i) => i !== index))
  }

  const processAllFiles = async () => {
    if (selectedFiles.length === 0) return

    setIsUploading(true)
    setProgress(0)

    let completed = 0

    // Process files sequentially to avoid overwhelming the server
    for (let i = 0; i < selectedFiles.length; i++) {
      if (batchResults[i].status === "success") {
        completed++
        continue
      }

      // Update status to processing
      setBatchResults((prev) => {
        const updated = [...prev]
        updated[i] = { ...updated[i], status: "processing" }
        return updated
      })

      try {
        const result = await uploadXRay(selectedFiles[i], useGradcam)

        // Update with result
        setBatchResults((prev) => {
          const updated = [...prev]
          updated[i] = {
            ...updated[i],
            status: "success",
            result,
          }
          return updated
        })

        // Save to report history
        saveToReportHistory(result, batchResults[i].preview)
      } catch (error) {
        // Update with error
        setBatchResults((prev) => {
          const updated = [...prev]
          updated[i] = { ...updated[i], status: "error" }
          return updated
        })
      }

      completed++
      setProgress(Math.round((completed / selectedFiles.length) * 100))
    }

    setIsUploading(false)

    toast({
      title: "Batch processing complete",
      description: `Successfully processed ${batchResults.filter((r) => r.status === "success").length} of ${selectedFiles.length} images`,
    })
  }

  const saveToReportHistory = (results: any, imageData: string) => {
    try {
      // Get existing reports or initialize empty array
      const existingReports = JSON.parse(localStorage.getItem("reportHistory") || "[]")

      // Create a new report entry
      const newReport = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        results: results,
        image: imageData,
        patientInfo: {
          id: "P" + Math.floor(Math.random() * 10000),
          name: "Anonymous Patient",
        },
      }

      // Add to the beginning of the array (most recent first)
      existingReports.unshift(newReport)

      // Limit to 50 reports to prevent localStorage from getting too large
      const limitedReports = existingReports.slice(0, 50)

      // Save back to localStorage
      localStorage.setItem("reportHistory", JSON.stringify(limitedReports))
    } catch (error) {
      console.error("Failed to save report to history:", error)
    }
  }

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Batch X-Ray Processing</CardTitle>
        <CardDescription>Upload multiple chest X-ray images for batch analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6 transition-colors border-muted-foreground/25">
            <input
              type="file"
              id="batch-file-upload"
              className="hidden"
              onChange={handleFileInput}
              accept="image/*"
              multiple
            />

            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium">Drag & drop multiple X-ray images</p>
                <p className="text-sm text-muted-foreground mt-1">or click to browse from your computer</p>
              </div>

              <Button variant="outline" onClick={() => document.getElementById("batch-file-upload")?.click()}>
                <FileUp className="h-4 w-4 mr-2" />
                Browse Files
              </Button>

              <p className="text-xs text-muted-foreground mt-2">Supported formats: JPEG, PNG, DICOM</p>
            </div>
          </div>

          {batchResults.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mt-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center space-x-2">
                        <Switch id="gradcam-toggle" checked={useGradcam} onCheckedChange={setUseGradcam} />
                        <Label htmlFor="gradcam-toggle" className="flex items-center cursor-pointer">
                          <Eye className="h-4 w-4 mr-1" />
                          Generate Grad-CAM for all images
                        </Label>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Grad-CAM highlights areas the AI model focuses on when making predictions</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                {batchResults.map((result, index) => (
                  <div key={index} className="relative border rounded-md overflow-hidden">
                    <div className="aspect-square relative">
                      <img
                        src={result.preview || "/placeholder.svg"}
                        alt={`X-ray ${index + 1}`}
                        className="object-cover w-full h-full"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 rounded-full"
                        onClick={() => removeFile(index)}
                        disabled={isUploading}
                      >
                        <X className="h-3 w-3" />
                      </Button>

                      {result.status === "processing" && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      )}

                      {result.status === "success" && (
                        <div className="absolute bottom-0 left-0 right-0 bg-background/80 p-2">
                          <div className="flex items-center">
                            <Check className="h-4 w-4 mr-1 text-success" />
                            <span
                              className={
                                result.result?.predicted_class === "PNEUMONIA"
                                  ? "text-destructive font-medium"
                                  : "text-success font-medium"
                              }
                            >
                              {result.result?.predicted_class}
                            </span>
                          </div>
                          <div className="text-xs">Confidence: {Math.round(result.result?.prediction * 100)}%</div>
                        </div>
                      )}

                      {result.status === "error" && (
                        <div className="absolute bottom-0 left-0 right-0 bg-destructive/80 p-2 text-white text-center">
                          Processing Failed
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              <div className="flex justify-center pt-2">
                <Button onClick={processAllFiles} disabled={isUploading || batchResults.length === 0}>
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing Batch...
                    </>
                  ) : (
                    "Process All Images"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <p className="text-sm text-muted-foreground">
          {batchResults.length > 0
            ? `${batchResults.length} files selected`
            : "Select multiple files for batch processing"}
        </p>
      </CardFooter>
    </Card>
  )
}
