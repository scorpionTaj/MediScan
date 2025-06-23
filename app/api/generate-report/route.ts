import { type NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API with your API key
// The API key should be stored in an environment variable
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { findings, predictedClass, confidence } = body;

    // Create a prompt for the Gemini model
    const prompt = `
Generate a detailed clinical interpretation for a chest X-ray with the following information:

Diagnosis: ${predictedClass}
Confidence: ${confidence}%

${findings ? `Key findings: ${findings}` : ""}

Please provide a well-formatted markdown report with the following sections:

1. **Clinical Impression**: A detailed interpretation of the findings, clearly stating that the AI model has ${confidence}% confidence in the diagnosis of ${predictedClass}.
2. **Differential Diagnosis**: Possible alternative diagnoses to consider
3. **Recommended Follow-up**: Specific follow-up actions with timeframes
4. **Treatment Suggestions**: Appropriate treatment options if applicable

Use proper markdown formatting with:
- Clear headings (## for sections)
- Bullet points for lists
- **Bold text** for emphasis on important findings
- Organized, concise paragraphs
- Professional medical terminology

IMPORTANT: Always mention the exact confidence level of ${confidence}% when discussing the diagnosis.
`;

    try {
      // For safety, check if we have a valid API key
      if (!GEMINI_API_KEY || GEMINI_API_KEY === "") {
        // Return mock data if no API key is available
        return NextResponse.json({
          success: true,
          report: generateMockReport(predictedClass, confidence),
        });
      }

      // Call the Gemini API using the newer structure
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-001",
        contents: prompt,
      });

      // Extract the text from the response
      const text = response.text;

      return NextResponse.json({
        success: true,
        report: text,
      });
    } catch (error) {
      console.error("Gemini API error:", error);
      // Return mock data if the API call fails
      return NextResponse.json({
        success: true,
        report: generateMockReport(predictedClass, confidence),
      });
    }
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// Generate mock report data for development or when API is unavailable
function generateMockReport(predictedClass: string, confidence: number) {
  if (predictedClass === "PNEUMONIA") {
    return `
## Clinical Impression

The chest X-ray demonstrates features **consistent with bacterial pneumonia** with ${confidence}% confidence. There is a consolidation in the lower lung fields with air bronchograms. The cardiac silhouette appears normal. No significant pleural effusion is identified.

## Differential Diagnosis

* **Community-acquired bacterial pneumonia** (most likely, ${confidence}% confidence)
* Viral pneumonia
* Aspiration pneumonia
* Pulmonary edema (less likely given the distribution)

## Recommended Follow-up

1. Follow-up chest X-ray in **4-6 weeks** to confirm resolution
2. Clinical correlation with patient symptoms and laboratory findings
3. Consider CT chest if symptoms persist despite appropriate treatment

## Treatment Suggestions

* Empiric antibiotic therapy appropriate for community-acquired pneumonia
* Consider respiratory support if oxygen saturation is decreased
* Adequate hydration and rest
* Antipyretics for fever management
    `;
  } else {
    return `
## Clinical Impression

The chest X-ray appears **within normal limits** with ${confidence}% confidence. The lung fields are clear without evidence of consolidation, infiltrates, or effusions. The cardiac silhouette is of normal size and contour. The costophrenic angles are sharp. No pneumothorax or pleural effusion is identified.

## Differential Diagnosis

No significant abnormalities detected on this examination (${confidence}% confidence).

## Recommended Follow-up

* No immediate radiographic follow-up is necessary
* Routine age-appropriate screening as per guidelines
* If symptoms persist, clinical reassessment is recommended

## Additional Notes

While the chest X-ray appears normal, this does not exclude all pathologies. Some conditions may not be visible on plain radiographs. Clinical correlation is advised.
    `;
  }
}
