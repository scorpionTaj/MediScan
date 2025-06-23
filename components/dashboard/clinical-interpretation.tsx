"use client";

import type React from "react";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function ClinicalInterpretation({
  confidence = 95,
}: {
  confidence?: number;
}) {
  const [openSection, setOpenSection] = useState<string>("findings");

  return (
    <div className="space-y-4">
      <InterpretationSection
        id="findings"
        title="Key Findings"
        isOpen={openSection === "findings"}
        onToggle={() =>
          setOpenSection(openSection === "findings" ? "" : "findings")
        }
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
        onToggle={() =>
          setOpenSection(openSection === "impression" ? "" : "impression")
        }
      >
        <p className="text-sm text-muted-foreground">
          The image shows features consistent with bacterial pneumonia in the
          right lower lobe with {confidence}% confidence. The consolidation
          pattern and distribution are typical for community-acquired pneumonia.
          No evidence of cavitation or significant lymphadenopathy.
        </p>
      </InterpretationSection>

      <Separator />

      <InterpretationSection
        id="recommendations"
        title="Recommendations"
        isOpen={openSection === "recommendations"}
        onToggle={() =>
          setOpenSection(
            openSection === "recommendations" ? "" : "recommendations"
          )
        }
      >
        <ul className="space-y-2 text-sm">
          <li className="flex items-start">
            <span className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-2 flex-shrink-0">
              1
            </span>
            <span>
              Consider antibiotic therapy appropriate for community-acquired
              pneumonia
            </span>
          </li>
          <li className="flex items-start">
            <span className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-2 flex-shrink-0">
              2
            </span>
            <span>
              Follow-up chest X-ray in 4-6 weeks to confirm resolution
            </span>
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
  );
}

interface InterpretationSectionProps {
  id: string;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function InterpretationSection({
  id,
  title,
  isOpen,
  onToggle,
  children,
}: InterpretationSectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="pt-2">{children}</CollapsibleContent>
    </Collapsible>
  );
}
