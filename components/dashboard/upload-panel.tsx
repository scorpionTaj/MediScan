"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileUp, Loader2, Upload, X, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { uploadXRay } from "@/lib/api-service"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function UploadPanel() {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [useGradcam, setUseGradcam] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      handleFile(file)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      handleFile(file)
    }
  }

  const handleFile = (file: File) => {
    // Check if file is an image
    if (!file.type.match("image.*")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setPreview(result)
    }
    reader.readAsDataURL(file)
  }

  const clearSelection = () => {
    setSelectedFile(null)
    setPreview(null)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)

    try {
      const data = await uploadXRay(selectedFile, useGradcam)

      if (data.success !== false) {
        // Store the results in localStorage for demo purposes
        localStorage.setItem("analysisResults", JSON.stringify(data))
        localStorage.setItem("uploadedImage", preview || "")

        // Redirect to results page
        router.push("/dashboard/results")
      } else {
        toast({
          title: "Upload failed",
          description: data.message || "There was an error uploading your image. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Upload Chest X-Ray</CardTitle>
        <CardDescription>Upload a chest X-ray image for pneumonia detection analysis</CardDescription>
      </CardHeader>
      <CardContent>
        {!selectedFile ? (
          <div
            className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
              isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/25"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input type="file" id="file-upload" className="hidden" onChange={handleFileInput} accept="image/*" />

            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium">Drag & drop your chest X-ray image</p>
                <p className="text-sm text-muted-foreground mt-1">or click to browse from your computer</p>
              </div>

              <Button variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
                <FileUp className="h-4 w-4 mr-2" />
                Browse Files
              </Button>

              <p className="text-xs text-muted-foreground mt-2">Supported formats: JPEG, PNG, DICOM</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={preview || "/placeholder.svg"}
                alt="Preview"
                className="max-h-64 w-full rounded-md object-contain mx-auto"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-3 -right-3 h-7 w-7 rounded-full"
                onClick={clearSelection}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-2 mt-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-2">
                      <Switch id="gradcam-toggle" checked={useGradcam} onCheckedChange={setUseGradcam} />
                      <Label htmlFor="gradcam-toggle" className="flex items-center cursor-pointer">
                        <Eye className="h-4 w-4 mr-1" />
                        Generate Grad-CAM Visualization
                      </Label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Grad-CAM highlights areas the AI model focuses on when making predictions</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex justify-center pt-2">
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze Image"
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <p className="text-sm text-muted-foreground">For best results, use high-quality X-ray images</p>
      </CardFooter>
    </Card>
  )
}
