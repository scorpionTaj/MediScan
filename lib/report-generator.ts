import { jsPDF } from "jspdf"
import "jspdf-autotable"

interface PatientInfo {
  id: string
  name: string
  date: string
  age?: string
  gender?: string
  email?: string
}

interface ResultsData {
  prediction: number
  predictedClass: string
  confidence: string
}

interface ReportData {
  patientInfo: PatientInfo
  results: ResultsData
  imageUrl: string
  heatmapUrl: string | null
  aiReport?: string | null
}

export async function generatePdfReport(data: ReportData): Promise<void> {
  // Create a new PDF document
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  // Add title
  doc.setFontSize(20)
  doc.setTextColor(128, 0, 128) // Purple color
  doc.text("MediScan X-Ray Analysis Report", 105, 20, { align: "center" })

  // Add date and time
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  const now = new Date()
  const formattedDate = `${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getFullYear()}`
  const formattedTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`
  doc.text(`Generated on: ${formattedDate} ${formattedTime}`, 105, 27, { align: "center" })

  // Add horizontal line
  doc.setDrawColor(200, 200, 200)
  doc.line(20, 30, 190, 30)

  // Add patient information
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text("Patient Information", 20, 40)

  doc.setFontSize(10)
  doc.text(`Patient ID: ${data.patientInfo.id}`, 20, 48)
  doc.text(`Patient Name: ${data.patientInfo.name}`, 20, 54)
  doc.text(`Examination Date: ${data.patientInfo.date}`, 20, 60)

  // Add additional patient information if available
  let yPos = 66
  if (data.patientInfo.age) {
    doc.text(`Age: ${data.patientInfo.age}`, 20, yPos)
    yPos += 6
  }
  if (data.patientInfo.gender) {
    doc.text(`Gender: ${data.patientInfo.gender}`, 20, yPos)
    yPos += 6
  }

  // Add analysis results
  doc.setFontSize(12)
  doc.text("Analysis Results", 20, yPos)
  yPos += 8

  doc.setFontSize(10)
  doc.text(`Diagnosis: ${data.results.predictedClass}`, 20, yPos)
  yPos += 6
  doc.text(`Confidence: ${data.results.confidence}`, 20, yPos)
  yPos += 10

  // Add AI-generated clinical interpretation if available
  if (data.aiReport) {
    doc.setFontSize(12)
    doc.text("AI-Generated Clinical Report", 20, yPos)
    yPos += 8

    doc.setFontSize(9)

    // Split the AI report into lines and add them to the PDF
    const aiReportLines = data.aiReport.split("\n")
    for (const line of aiReportLines) {
      // Check if we need to add a new page
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      // Check if the line is a heading (starts with #)
      if (line.startsWith("#")) {
        doc.setFontSize(10)
        doc.setFont(undefined, "bold")
        doc.text(line.replace(/^#+\s*/, ""), 20, yPos)
        doc.setFont(undefined, "normal")
        doc.setFontSize(9)
      } else if (line.trim() === "") {
        // Skip empty lines
      } else {
        // Handle bullet points
        if (line.trim().startsWith("*") || line.trim().startsWith("-") || line.trim().startsWith("•")) {
          doc.text(`  ${line.trim().substring(1).trim()}`, 20, yPos)
        } else if (/^\d+\./.test(line.trim())) {
          // Numbered list
          doc.text(`  ${line.trim()}`, 20, yPos)
        } else {
          doc.text(line, 20, yPos)
        }
      }
      yPos += 5
    }

    yPos += 5
  } else {
    // Add default clinical interpretation if AI report is not available
    doc.setFontSize(12)
    doc.text("Clinical Interpretation", 20, yPos)
    yPos += 8

    doc.setFontSize(10)
    if (data.results.predictedClass === "PNEUMONIA") {
      doc.text("Key Findings:", 20, yPos)
      yPos += 6
      doc.text("• Opacity in the lung fields", 25, yPos)
      yPos += 6
      doc.text("• Consolidation pattern consistent with pneumonia", 25, yPos)
      yPos += 6
      doc.text("• Possible pleural effusion", 25, yPos)
      yPos += 10

      doc.text("Recommendations:", 20, yPos)
      yPos += 6
      doc.text("• Consider antibiotic therapy appropriate for community-acquired pneumonia", 25, yPos)
      yPos += 6
      doc.text("• Follow-up chest X-ray in 4-6 weeks to confirm resolution", 25, yPos)
      yPos += 6
      doc.text("• Monitor oxygen saturation and respiratory status", 25, yPos)
    } else {
      doc.text("Key Findings:", 20, yPos)
      yPos += 6
      doc.text("• No significant opacities in the lung fields", 25, yPos)
      yPos += 6
      doc.text("• Normal cardiac silhouette", 25, yPos)
      yPos += 6
      doc.text("• No pleural effusion", 25, yPos)
      yPos += 10

      doc.text("Recommendations:", 20, yPos)
      yPos += 6
      doc.text("• No specific action required for pneumonia", 25, yPos)
      yPos += 6
      doc.text("• Continue routine care as needed", 25, yPos)
    }
  }

  // Add disclaimer
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text(
    "DISCLAIMER: This is an AI-assisted analysis. Always consult with a radiologist for final diagnosis.",
    105,
    280,
    { align: "center" },
  )

  // Add images
  try {
    // Original X-ray image
    await addImageToPdf(doc, data.imageUrl, "Original X-Ray", 20, 170, 80, 80)

    // Heatmap image if available
    if (data.heatmapUrl) {
      await addImageToPdf(doc, data.heatmapUrl, "Grad-CAM Visualization", 110, 170, 80, 80)
    }
  } catch (error) {
    console.error("Error adding images to PDF:", error)
  }

  // Add footer
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text("MediScan - AI-powered pneumonia detection", 105, 285, { align: "center" })
  doc.text("Page 1 of 1", 105, 290, { align: "center" })

  // Save the PDF
  doc.save(`MediScan_Report_${data.patientInfo.id}_${new Date().toISOString().split("T")[0]}.pdf`)
}

async function addImageToPdf(
  doc: any,
  imageUrl: string,
  title: string,
  x: number,
  y: number,
  width: number,
  height: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image()
      img.crossOrigin = "Anonymous"

      img.onload = () => {
        try {
          // Add title
          doc.setFontSize(9)
          doc.setTextColor(0, 0, 0)
          doc.text(title, x + width / 2, y - 5, { align: "center" })

          // Add image
          doc.addImage(img, "JPEG", x, y, width, height)
          resolve()
        } catch (err) {
          console.error("Error adding image to PDF:", err)
          reject(err)
        }
      }

      img.onerror = (err) => {
        console.error("Error loading image:", err)
        reject(err)
      }

      // Handle base64 images
      if (imageUrl.startsWith("data:")) {
        img.src = imageUrl
      } else {
        img.src = imageUrl
      }
    } catch (error) {
      reject(error)
    }
  })
}
