import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log("Login attempt:", { email, password });

    // Try to forward the request to the Flask server
    try {
      const response = await fetch("http://127.0.0.1:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      console.log("Flask response status:", response.status);

      // Check the content type before trying to parse as JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        // Not JSON, try to get the text to see what's being returned
        const text = await response.text();
        console.error(
          "Flask server returned non-JSON response:",
          text.substring(0, 200) + "..."
        );
        throw new Error("Flask server returned non-JSON response");
      }

      // Get the response data
      const responseData = await response.json();
      console.log("Flask response data:", responseData);

      // If login was successful on the Flask server
      if (responseData.success) {
        // Create a response with the user data
        const nextResponse = NextResponse.json(responseData);

        // Forward any cookies from Flask to the client
        const cookies = response.headers.getSetCookie();
        if (cookies && cookies.length > 0) {
          for (const cookie of cookies) {
            nextResponse.headers.append("Set-Cookie", cookie);
          }
        }

        return nextResponse;
      } else {
        // Return the error from Flask
        return NextResponse.json(responseData, { status: response.status });
      }
    } catch (error) {
      console.error("Failed to connect to Flask server:", error);
    }

    // For development/demo purposes, allow login with test credentials
    if (email === "demo@example.com" && password === "password") {
      const response = NextResponse.json({
        success: true,
        user: {
          name: "Demo User",
          email: "demo@example.com",
          role: "doctor",
        },
      });

      // Set a session cookie for the demo user
      response.cookies.set({
        name: "session",
        value: "demo-session",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 1 day
        path: "/",
      });

      return response;
    }

    return NextResponse.json(
      { success: false, message: "Invalid credentials" },
      { status: 401 }
    );
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
