"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Download,
  FileText,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PredictionGauge } from "@/components/dashboard/clinical-components";
import { ClinicalInterpretation } from "@/components/dashboard/clinical-components";
import { generatePdfReport } from "@/lib/report-generator";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "@/components/ui/modal";
import { useToast } from "@/components/ui/use-toast";
import { Slider } from "@/components/ui/slider";
import { format } from "date-fns";
import {
  sendReportNotification,
  requestNotificationPermission,
} from "@/lib/notification-service";
import ReactMarkdown from "react-markdown";
import { ConfidenceExplainer } from "@/components/dashboard/confidence-explainer";

export function ResultsPanel() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.7);
  const [results, setResults] = useState<any>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [patientInfo, setPatientInfo] = useState({
    name: "",
    id: "",
    age: "",
    gender: "Male",
    email: "",
  });
  const [notifyByBrowser, setNotifyByBrowser] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isLoadingAiReport, setIsLoadingAiReport] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Use actual prediction from results, ensuring it's displayed correctly
  const predictionScore = results
    ? results.predicted_class === "PNEUMONIA"
      ? results.prediction
      : 1 - results.prediction
    : 0.5;

  useEffect(() => {
    // Get results from localStorage (set during upload)
    const image = localStorage.getItem("uploadedImage");
    const analysisResults = localStorage.getItem("analysisResults");

    if (!image || !analysisResults) {
      router.push("/dashboard");
      return;
    }

    setUploadedImage(image);

    const parsedResults = JSON.parse(analysisResults);

    // Save the results to the reports history
    saveToReportHistory(parsedResults, image);

    setResults(parsedResults);

    // Generate AI report
    generateAiReport(
      parsedResults.predicted_class,
      (predictionScore * 100).toFixed(1)
    );
  }, [router]);

  const generateAiReport = async (
    predictedClass: string,
    confidence: string
  ) => {
    setIsLoadingAiReport(true);
    try {
      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          predictedClass,
          confidence,
          findings:
            predictedClass === "PNEUMONIA"
              ? "Opacity in the right lower lobe, consolidation pattern consistent with pneumonia, possible pleural effusion on right side"
              : "No significant opacities, normal cardiac silhouette, clear lung fields",
        }),
      });

      const data = await response.json();
      if (data.success) {
        setAiReport(data.report);
      } else {
        console.error("Failed to generate AI report:", data.message);
      }
    } catch (error) {
      console.error("Error generating AI report:", error);
    } finally {
      setIsLoadingAiReport(false);
    }
  };

  const saveToReportHistory = (results: any, imageData: string) => {
    try {
      // Get existing reports or initialize empty array
      const existingReports = JSON.parse(
        localStorage.getItem("reportHistory") || "[]"
      );

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
      };

      // Add to the beginning of the array (most recent first)
      existingReports.unshift(newReport);

      // Limit to 10 reports to prevent localStorage from getting too large
      const limitedReports = existingReports.slice(0, 10);

      // Save back to localStorage
      localStorage.setItem("reportHistory", JSON.stringify(limitedReports));
    } catch (error) {
      console.error("Failed to save report to history:", error);
    }
  };

  const handleDownloadImage = () => {
    if (!uploadedImage) return;

    // Create a temporary link element
    const link = document.createElement("a");

    // Set the download attributes
    link.download = `xray-analysis-${
      new Date().toISOString().split("T")[0]
    }.jpg`;
    link.href = uploadedImage;

    // Append to the document, click it, and remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenPatientModal = () => {
    // Generate a random patient ID if empty
    if (!patientInfo.id) {
      setPatientInfo({
        ...patientInfo,
        id: "P" + Math.floor(Math.random() * 10000),
      });
    }
    setPatientModalOpen(true);
  };

  const handleGenerateReport = async () => {
    if (!results || !uploadedImage) return;

    setIsGeneratingReport(true);
    setPatientModalOpen(false);

    try {
      await generatePdfReport({
        patientInfo: {
          id: patientInfo.id || "P" + Math.floor(Math.random() * 10000),
          name: patientInfo.name || "Anonymous Patient",
          date: format(new Date(), "dd/MM/yyyy"),
          age: patientInfo.age,
          gender: patientInfo.gender,
        },
        results: {
          prediction: predictionScore,
          predictedClass: results.predicted_class || "Unknown",
          confidence: (predictionScore * 100).toFixed(1) + "%",
        },
        imageUrl: uploadedImage,
        heatmapUrl: results.gradcam_image
          ? `data:image/jpeg;base64,${results.gradcam_image}`
          : null,
        aiReport: aiReport,
      });

      // If browser notification is enabled, send the notification
      if (notifyByBrowser) {
        const permissionGranted = await requestNotificationPermission();
        if (permissionGranted) {
          sendReportNotification(
            patientInfo.name || "Anonymous Patient",
            results.predicted_class
          );
        } else {
          toast({
            title: "Notification Permission Denied",
            description:
              "Please enable notifications in your browser settings.",
            variant: "destructive",
          });
        }
      }

      // Update the report in history with patient info
      updateReportWithPatientInfo();
    } catch (error) {
      console.error("Failed to generate report:", error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const updateReportWithPatientInfo = () => {
    try {
      const reports = JSON.parse(localStorage.getItem("reportHistory") || "[]");
      if (reports.length > 0) {
        // Update the most recent report with patient info
        reports[0].patientInfo = {
          id: patientInfo.id || reports[0].patientInfo.id,
          name: patientInfo.name || reports[0].patientInfo.name,
          age: patientInfo.age,
          gender: patientInfo.gender,
        };
        localStorage.setItem("reportHistory", JSON.stringify(reports));
      }
    } catch (error) {
      console.error("Failed to update report with patient info:", error);
    }
  };

  const toggleFullscreen = () => {
    if (!imageContainerRef.current) return;

    if (!isFullscreen) {
      if (imageContainerRef.current.requestFullscreen) {
        imageContainerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  if (!uploadedImage) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-12 w-12 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-muted-foreground">Loading results...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>X-Ray Analysis</CardTitle>
          <CardDescription>
            Visualization of the chest X-ray with Grad-CAM overlay
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            ref={imageContainerRef}
            className={`relative aspect-square bg-muted rounded-lg overflow-hidden ${
              isFullscreen ? "fullscreen-container" : ""
            }`}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                ref={imageRef}
                src={uploadedImage || "/placeholder.svg"}
                alt="Chest X-Ray"
                className="max-h-full max-w-full object-contain transition-transform"
                style={{ transform: `scale(${zoomLevel})` }}
              />
              {showHeatmap && results && results.gradcam_image && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    backgroundImage: `url(data:image/jpeg;base64,${results.gradcam_image})`,
                    backgroundPosition: "center",
                    backgroundSize: "contain",
                    backgroundRepeat: "no-repeat",
                    opacity: heatmapOpacity,
                    transform: `scale(${zoomLevel})`,
                  }}
                />
              )}
            </div>
            <div className="absolute bottom-4 right-4 flex flex-col space-y-2 bg-background/90 p-2 rounded-lg shadow-sm">
              <div className="flex items-center space-x-2">
                <Switch
                  id="heatmap-toggle"
                  checked={showHeatmap}
                  onCheckedChange={setShowHeatmap}
                />
                <Label htmlFor="heatmap-toggle" className="text-sm font-medium">
                  Grad-CAM Overlay
                </Label>
              </div>
              {showHeatmap && (
                <div className="flex items-center space-x-2">
                  <Label htmlFor="opacity-slider" className="text-xs w-14">
                    Opacity:
                  </Label>
                  <Slider
                    id="opacity-slider"
                    min={0.1}
                    max={1}
                    step={0.1}
                    value={[heatmapOpacity]}
                    onValueChange={(value) => setHeatmapOpacity(value[0])}
                    className="w-24"
                  />
                </div>
              )}
            </div>
            <div className="absolute top-4 right-4 flex space-x-2 bg-background/90 p-2 rounded-lg shadow-sm">
              <Button
                variant="outline"
                size="icon"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={toggleFullscreen}>
                {isFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            New Analysis
          </Button>
          <Button onClick={handleDownloadImage} className="bg-primary">
            <Download className="h-4 w-4 mr-2" />
            Download Image
          </Button>
        </CardFooter>
      </Card>

      <div className="space-y-6 md:col-span-1">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Prediction Results</CardTitle>
              <ConfidenceExplainer />
            </div>
            <CardDescription>AI-based diagnostic prediction</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <PredictionGauge value={predictionScore} />
            <div className="mt-4 text-center">
              <p className="text-lg font-semibold text-primary">
                {results?.predicted_class || "Analysis Complete"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Confidence: {(predictionScore * 100).toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clinical Analysis</CardTitle>
            <CardDescription>
              Detailed interpretation of results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="ai-report">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="ai-report">AI Report</TabsTrigger>
                <TabsTrigger value="interpretation">Interpretation</TabsTrigger>
                <TabsTrigger value="technical">Technical Details</TabsTrigger>
              </TabsList>

              <TabsContent value="ai-report" className="pt-4">
                {isLoadingAiReport ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Generating AI report...
                    </p>
                  </div>
                ) : aiReport ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{aiReport}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Failed to generate AI report.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() =>
                        generateAiReport(
                          results.predicted_class,
                          (predictionScore * 100).toFixed(1)
                        )
                      }
                    >
                      Retry
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="interpretation" className="pt-4">
                <ClinicalInterpretation
                  confidence={Math.round(predictionScore * 100)}
                />
              </TabsContent>

              <TabsContent value="technical" className="pt-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Model Information</h4>
                    <p className="text-sm text-muted-foreground">
                      EfficientNet-B3 fine-tuned on chest X-ray dataset with
                      15,000+ images
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Processing Details</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                      <li>
                        Image preprocessing: Contrast enhancement, noise
                        reduction
                      </li>
                      <li>
                        CLAHE (Contrast Limited Adaptive Histogram Equalization)
                      </li>
                      <li>Gamma correction (gamma = 0.7)</li>
                      <li>Gaussian blur for noise reduction</li>
                      <li>Grad-CAM visualization of model attention areas</li>
                      <li>Confidence threshold: 0.5 (binary classification)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Model Performance</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                      <li>Accuracy: 94.2%</li>
                      <li>Sensitivity: 93.8%</li>
                      <li>Specificity: 94.5%</li>
                      <li>F1 Score: 0.941</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Alert variant="warning" className="w-full">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>AI-Assisted Analysis</AlertTitle>
              <AlertDescription>
                This is an AI-assisted analysis. Always consult with a
                radiologist for final diagnosis.
              </AlertDescription>
            </Alert>
          </CardFooter>
        </Card>

        <Button
          className="w-full"
          onClick={handleOpenPatientModal}
          disabled={isGeneratingReport}
        >
          <FileText className="h-4 w-4 mr-2" />
          {isGeneratingReport ? "Generating Report..." : "Generate Full Report"}
        </Button>
      </div>

      {/* Patient Information Modal */}
      <Modal open={patientModalOpen} onOpenChange={setPatientModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Patient Information</ModalTitle>
            <ModalDescription>
              Enter patient details for the report
            </ModalDescription>
          </ModalHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="patient-id" className="text-right">
                Patient ID
              </Label>
              <Input
                id="patient-id"
                value={patientInfo.id}
                onChange={(e) =>
                  setPatientInfo({ ...patientInfo, id: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="patient-name" className="text-right">
                Full Name
              </Label>
              <Input
                id="patient-name"
                value={patientInfo.name}
                onChange={(e) =>
                  setPatientInfo({ ...patientInfo, name: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="patient-age" className="text-right">
                Age
              </Label>
              <Input
                id="patient-age"
                type="number"
                value={patientInfo.age}
                onChange={(e) =>
                  setPatientInfo({ ...patientInfo, age: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="patient-gender" className="text-right">
                Gender
              </Label>
              <select
                id="patient-gender"
                value={patientInfo.gender}
                onChange={(e) =>
                  setPatientInfo({ ...patientInfo, gender: e.target.value })
                }
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-right">
                <Label htmlFor="notify-browser">Notify</Label>
              </div>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="notify-browser"
                  checked={notifyByBrowser}
                  onCheckedChange={setNotifyByBrowser}
                />
                <Label htmlFor="notify-browser">
                  Send browser notification
                </Label>
              </div>
            </div>
          </div>
          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => setPatientModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateReport}
              disabled={isGeneratingReport}
            >
              {isGeneratingReport ? "Generating..." : "Generate Report"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
