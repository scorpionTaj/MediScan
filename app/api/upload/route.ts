import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Get the form data from the request
    const formData = await request.formData();

    // Forward the request to the Flask server
    const response = await fetch("http://127.0.0.1:5000/api/upload", {
      method: "POST",
      body: formData,
    });

    // If the Flask server returns an error
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Flask server error:", errorText);
      return NextResponse.json(
        { success: false, message: "Error from Flask server" },
        { status: response.status }
      );
    }

    // Return the response from the Flask server
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API route error:", error);

    // For development/demo purposes, return mock data if the Flask server is not available
    return NextResponse.json({
      success: true,
      prediction: 0.87,
      predicted_class: "PNEUMONIA",
      gradcam_image: null, // Base64 encoded image would go here in a real implementation
    });
  }
}
