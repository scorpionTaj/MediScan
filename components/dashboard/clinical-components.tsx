"use client"

import React, { useState } from "react"
import { ChevronDown, ChevronUp, Upload, FileUp, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useTheme } from "next-themes"

/**
 * Prediction Gauge Component
 */
export function PredictionGauge({ value }: { value: number }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()
  const isDarkTheme = theme === "dark"

  React.useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const size = 180
    canvas.width = size
    canvas.height = size

    // Clear canvas
    ctx.clearRect(0, 0, size, size)

    // Draw background arc
    const centerX = size / 2
    const centerY = size / 2
    const radius = size * 0.4
    const startAngle = Math.PI * 0.8
    const endAngle = Math.PI * 2.2

    // Background track - use CSS variables for theme compatibility
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, startAngle, endAngle)
    ctx.lineWidth = 12
    ctx.strokeStyle = isDarkTheme ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)"
    ctx.stroke()

    // Calculate color based on value
    let color
    if (value < 0.3) {
      color = getComputedStyle(document.documentElement).getPropertyValue("--success").trim() || "#22c55e"
    } else if (value < 0.7) {
      color = getComputedStyle(document.documentElement).getPropertyValue("--warning").trim() || "#f59e0b"
    } else {
      color = getComputedStyle(document.documentElement).getPropertyValue("--destructive").trim() || "#ef4444"
    }

    // Value arc
    const valueAngle = startAngle + (endAngle - startAngle) * value
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, startAngle, valueAngle)
    ctx.lineWidth = 12
    ctx.lineCap = "round"
    ctx.strokeStyle = color
    ctx.stroke()

    // Draw center text - use theme-appropriate colors
    ctx.fillStyle = isDarkTheme ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.9)"
    ctx.font = "bold 32px sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(`${Math.round(value * 100)}%`, centerX, centerY)

    // Draw label
    ctx.fillStyle = isDarkTheme ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)"
    ctx.font = "14px sans-serif"
    ctx.fillText("Probability", centerX, centerY + 25)
  }, [value, isDarkTheme, theme])

  return (
    <div className="relative">
      <canvas ref={canvasRef} width="180" height="180" />
    </div>
  )
}

/**
 * Clinical Interpretation Component
 */
export function ClinicalInterpretation() {
  const [openSection, setOpenSection] = useState<string>("findings")

  return (
    <div className="space-y-4">
      <InterpretationSection
        id="findings"
        title="Key Findings"
        isOpen={openSection === "findings"}
        onToggle={() => setOpenSection(openSection === "findings" ? "" : "findings")}
      >
        <ul className="space-y-2 text-sm">
          <li className="flex items-start">
            <span className="h-5 w-5 rounded-full bg-destructive/20 text-destructive flex items-center justify-center mr-2 flex-shrink-0">
              !
            </span>
            <span>Opacity in the right lower lobe</span>
          </li>
          <li className="flex items-start">
            <span className="h-5 w-5 rounded-full bg-destructive/20 text-destructive flex items-center justify-center mr-2 flex-shrink-0">
              !
            </span>
            <span>Consolidation pattern consistent with pneumonia</span>
          </li>
          <li className="flex items-start">
            <span className="h-5 w-5 rounded-full bg-warning/20 text-warning flex items-center justify-center mr-2 flex-shrink-0">
              ?
            </span>
            <span>Possible pleural effusion on right side</span>
          </li>
        </ul>
      </InterpretationSection>

      <Separator />

      <InterpretationSection
        id="impression"
        title="Clinical Impression"
        isOpen={openSection === "impression"}
        onToggle={() => setOpenSection(openSection === "impression" ? "" : "impression")}
      >
        <p className="text-sm text-muted-foreground">
          The image shows features consistent with bacterial pneumonia in the right lower lobe. The consolidation
          pattern and distribution are typical for community-acquired pneumonia. No evidence of cavitation or
          significant lymphadenopathy.
        </p>
      </InterpretationSection>

      <Separator />

      <InterpretationSection
        id="recommendations"
        title="Recommendations"
        isOpen={openSection === "recommendations"}
        onToggle={() => setOpenSection(openSection === "recommendations" ? "" : "recommendations")}
      >
        <ul className="space-y-2 text-sm">
          <li className="flex items-start">
            <span className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-2 flex-shrink-0">
              1
            </span>
            <span>Consider antibiotic therapy appropriate for community-acquired pneumonia</span>
          </li>
          <li className="flex items-start">
            <span className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-2 flex-shrink-0">
              2
            </span>
            <span>Follow-up chest X-ray in 4-6 weeks to confirm resolution</span>
          </li>
          <li className="flex items-start">
            <span className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-2 flex-shrink-0">
              3
            </span>
            <span>Monitor oxygen saturation and respiratory status</span>
          </li>
        </ul>
      </InterpretationSection>
    </div>
  )
}

interface InterpretationSectionProps {
  id: string
  title: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}

function InterpretationSection({ id, title, isOpen, onToggle, children }: InterpretationSectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="pt-2">{children}</CollapsibleContent>
    </Collapsible>
  )
}

/**
 * Image Uploader Component
 */
export function ImageUploader({ onImageUpload }: { onImageUpload: (file: File | null) => void }) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

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
      alert("Please select an image file")
      return
    }

    setSelectedFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    onImageUpload(file)
  }

  const clearSelection = () => {
    setSelectedFile(null)
    setPreview(null)
    onImageUpload(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
        isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/25"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input type="file" ref={fileInputRef} onChange={handleFileInput} accept="image/*" className="hidden" />

      <div className="flex flex-col items-center justify-center space-y-4">
        {preview ? (
          <div className="relative">
            <img src={preview || "/placeholder.svg"} alt="Preview" className="max-h-64 rounded-md object-contain" />
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-3 -right-3 h-7 w-7 rounded-full"
              onClick={clearSelection}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium">Drag & drop your chest X-ray image</p>
              <p className="text-sm text-muted-foreground mt-1">or click to browse from your computer</p>
            </div>
          </>
        )}

        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <FileUp className="h-4 w-4 mr-2" />
            Browse Files
          </Button>
          {selectedFile && <Button onClick={() => onImageUpload(selectedFile)}>Analyze Image</Button>}
        </div>

        <p className="text-xs text-muted-foreground mt-2">Supported formats: JPEG, PNG, DICOM</p>
      </div>
    </div>
  )
}
