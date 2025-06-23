import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Try to forward the request to the Flask server
    try {
      // Forward cookies from the client to Flask
      const cookies = request.headers.get("cookie") || "";

      const response = await fetch("http://127.0.0.1:5000/api/user", {
        method: "GET",
        headers: {
          Cookie: cookies,
        },
        credentials: "include",
      });

      // If the request was successful
      if (response.ok) {
        const data = await response.json();

        // Create a response with the user data
        const nextResponse = NextResponse.json(data);

        // Forward any cookies from Flask to the client
        const flaskCookies = response.headers.getSetCookie();
        if (flaskCookies && flaskCookies.length > 0) {
          for (const cookie of flaskCookies) {
            nextResponse.headers.append("Set-Cookie", cookie);
          }
        }

        return nextResponse;
      } else {
        // If the user is not authenticated on Flask
        return NextResponse.json({ user: null }, { status: 200 });
      }
    } catch (error) {
      console.error("Failed to connect to Flask server:", error);
    }

    // For development/demo purposes, return null user
    return NextResponse.json({ user: null });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
