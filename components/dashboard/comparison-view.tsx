"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
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
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ComparisonItem {
  id: string;
  date: string;
  image: string;
  gradcamImage?: string;
  results: any;
}

export function ComparisonView() {
  const [comparisonItems, setComparisonItems] = useState<ComparisonItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.7);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<"side-by-side" | "slider">(
    "side-by-side"
  );
  const [sliderPosition, setSliderPosition] = useState(50);
  const router = useRouter();

  useEffect(() => {
    // Load reports from localStorage
    try {
      const savedReports = localStorage.getItem("reportHistory");
      if (savedReports) {
        const parsedReports = JSON.parse(savedReports);

        // Convert to comparison items
        const items: ComparisonItem[] = parsedReports.map((report: any) => ({
          id: report.id,
          date: new Date(report.date).toLocaleDateString(),
          image: report.image,
          gradcamImage: report.results.gradcam_image
            ? `data:image/jpeg;base64,${report.results.gradcam_image}`
            : undefined,
          results: report.results,
        }));

        setComparisonItems(items);

        // Select the first two items by default if available
        if (items.length >= 2) {
          setSelectedItems([items[0].id, items[1].id]);
        } else if (items.length === 1) {
          setSelectedItems([items[0].id]);
        }
      }
    } catch (error) {
      console.error("Failed to load comparison items:", error);
    }
  }, []);

  const getSelectedItemsData = () => {
    return comparisonItems.filter((item) => selectedItems.includes(item.id));
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      const element = document.getElementById("comparison-container");
      if (element?.requestFullscreen) {
        element.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
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

  const handleDownloadComparison = () => {
    // This would ideally create a side-by-side comparison image
    // For now, we'll just download the individual images
    const selectedData = getSelectedItemsData();

    selectedData.forEach((item, index) => {
      const link = document.createElement("a");
      link.download = `comparison-${index + 1}-${
        new Date().toISOString().split("T")[0]
      }.jpg`;
      link.href = item.image;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const renderSideBySideView = () => {
    const selectedData = getSelectedItemsData();

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {selectedData.map((item, index) => (
          <div
            key={item.id}
            className="relative aspect-square bg-muted rounded-lg overflow-hidden"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src={item.image || "/placeholder.svg"}
                alt={`X-ray ${index + 1}`}
                className="max-h-full max-w-full object-contain transition-transform"
                style={{ transform: `scale(${zoomLevel})` }}
              />
              {showHeatmap && item.gradcamImage && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    backgroundImage: `url(${item.gradcamImage})`,
                    backgroundPosition: "center",
                    backgroundSize: "contain",
                    backgroundRepeat: "no-repeat",
                    opacity: heatmapOpacity,
                    transform: `scale(${zoomLevel})`,
                  }}
                />
              )}
            </div>
            <div className="absolute bottom-4 left-4 bg-background/90 p-2 rounded-lg shadow-sm">
              <div className="text-sm font-medium">{item.date}</div>
              <div className="text-xs flex items-center">
                <span
                  className={
                    item.results.predicted_class === "PNEUMONIA"
                      ? "text-destructive"
                      : "text-success"
                  }
                >
                  {item.results.predicted_class}
                </span>
                <span className="mx-1">•</span>
                <span>
                  {Math.round(
                    (item.results.predicted_class === "PNEUMONIA"
                      ? item.results.prediction
                      : 1 - item.results.prediction) * 100
                  )}
                  % confidence
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSliderView = () => {
    const selectedData = getSelectedItemsData();
    if (selectedData.length < 2)
      return <div>Select two images to use the slider view</div>;

    const [image1, image2] = selectedData;

    return (
      <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
        {/* First image (background) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={image2.image || "/placeholder.svg"}
            alt="X-ray 2"
            className="max-h-full max-w-full object-contain transition-transform"
            style={{ transform: `scale(${zoomLevel})` }}
          />
          {showHeatmap && image2.gradcamImage && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                backgroundImage: `url(${image2.gradcamImage})`,
                backgroundPosition: "center",
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                opacity: heatmapOpacity,
                transform: `scale(${zoomLevel})`,
              }}
            />
          )}
        </div>

        {/* Second image (foreground with clip) */}
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img
            src={image1.image || "/placeholder.svg"}
            alt="X-ray 1"
            className="max-h-full max-w-full object-contain transition-transform"
            style={{ transform: `scale(${zoomLevel})` }}
          />
          {showHeatmap && image1.gradcamImage && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                backgroundImage: `url(${image1.gradcamImage})`,
                backgroundPosition: "center",
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                opacity: heatmapOpacity,
                transform: `scale(${zoomLevel})`,
              }}
            />
          )}
        </div>

        {/* Slider control */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <Slider
            value={[sliderPosition]}
            min={0}
            max={100}
            step={1}
            onValueChange={(value) => setSliderPosition(value[0])}
          />
        </div>

        {/* Date and diagnosis labels */}
        <div className="absolute top-4 left-4 bg-background/90 p-2 rounded-lg shadow-sm">
          <div className="text-sm font-medium">{image1.date}</div>
          <div className="text-xs">
            <span
              className={
                image1.results.predicted_class === "PNEUMONIA"
                  ? "text-destructive"
                  : "text-success"
              }
            >
              {image1.results.predicted_class}
            </span>
          </div>
        </div>

        <div className="absolute top-4 right-4 bg-background/90 p-2 rounded-lg shadow-sm">
          <div className="text-sm font-medium">{image2.date}</div>
          <div className="text-xs">
            <span
              className={
                image2.results.predicted_class === "PNEUMONIA"
                  ? "text-destructive"
                  : "text-success"
              }
            >
              {image2.results.predicted_class}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>X-Ray Comparison</CardTitle>
          <CardDescription>
            Compare multiple X-ray images side by side
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/2">
                <Label htmlFor="image1-select">First Image</Label>
                <Select
                  value={selectedItems[0] || ""}
                  onValueChange={(value) =>
                    setSelectedItems((prev) => [value, prev[1] || ""])
                  }
                >
                  <SelectTrigger id="image1-select">
                    <SelectValue placeholder="Select an image" />
                  </SelectTrigger>
                  <SelectContent>
                    {comparisonItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.date} - {item.results.predicted_class}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-1/2">
                <Label htmlFor="image2-select">Second Image</Label>
                <Select
                  value={selectedItems[1] || ""}
                  onValueChange={(value) =>
                    setSelectedItems((prev) => [prev[0] || "", value])
                  }
                >
                  <SelectTrigger id="image2-select">
                    <SelectValue placeholder="Select an image" />
                  </SelectTrigger>
                  <SelectContent>
                    {comparisonItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.date} - {item.results.predicted_class}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="heatmap-toggle"
                    checked={showHeatmap}
                    onCheckedChange={setShowHeatmap}
                  />
                  <Label htmlFor="heatmap-toggle">Grad-CAM Overlay</Label>
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

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 0.5}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 3}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                  {isFullscreen ? (
                    <Minimize className="h-4 w-4" />
                  ) : (
                    <Maximize className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Tabs
              value={viewMode}
              onValueChange={(value) =>
                setViewMode(value as "side-by-side" | "slider")
              }
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
                <TabsTrigger value="slider">Slider View</TabsTrigger>
              </TabsList>
              <TabsContent value="side-by-side" className="pt-4">
                <div
                  id="comparison-container"
                  className={isFullscreen ? "fullscreen-container" : ""}
                >
                  {renderSideBySideView()}
                </div>
              </TabsContent>
              <TabsContent value="slider" className="pt-4">
                <div
                  id="comparison-container"
                  className={isFullscreen ? "fullscreen-container" : ""}
                >
                  {renderSliderView()}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/patients")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
          <Button onClick={handleDownloadComparison}>
            <Download className="h-4 w-4 mr-2" />
            Download Comparison
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
