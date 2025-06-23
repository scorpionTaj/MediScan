"use client";

import { InfoIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ConfidenceExplainer() {
  return (
    <div className="flex items-center space-x-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">
              Learn how confidence values are calculated
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="link"
            className="text-xs text-muted-foreground p-0 h-auto"
          >
            About Confidence Values
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Understanding Confidence Values</DialogTitle>
            <DialogDescription>
              How MediScan calculates and displays confidence in diagnoses
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <p>
              The confidence percentage represents how certain the AI model is
              about its diagnosis.
            </p>

            <div className="space-y-2">
              <h4 className="font-medium">How it works:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  The AI model outputs a probability score between 0 and 1
                </li>
                <li>Values closer to 1 indicate pneumonia</li>
                <li>Values closer to 0 indicate normal</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Displayed confidence:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  For{" "}
                  <span className="font-medium text-destructive">
                    PNEUMONIA
                  </span>
                  : prediction × 100%
                </li>
                <li>
                  For <span className="font-medium text-success">NORMAL</span>:
                  (1 - prediction) × 100%
                </li>
              </ul>
            </div>

            <div className="bg-muted p-3 rounded-md">
              <p className="text-xs">
                <strong>Example:</strong> If the raw model output is 0.87, this
                means:
              </p>
              <ul className="text-xs list-disc pl-5 mt-1">
                <li>87% confidence in PNEUMONIA diagnosis</li>
                <li>13% confidence in NORMAL diagnosis</li>
              </ul>
              <p className="text-xs mt-1">
                The system will display the diagnosis with the higher
                confidence.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
