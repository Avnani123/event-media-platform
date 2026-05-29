import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // 1. Capture the multi-part data payload safely on the NextJS server layer
    const formData = await request.formData();
    const authHeader = request.headers.get("Authorization") || "";

    // 2. Stream the structured data package securely over to your Express backend instance
    const backendResponse = await fetch("http://localhost:5000/api/media/bulk-upload", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
      },
      body: formData, // Forwards the raw form data with automated browser multi-part boundaries intact
    });

    const contentType = backendResponse.headers.get("content-type");
    
    if (contentType && contentType.includes("application/json")) {
      const data = await backendResponse.json();
      return NextResponse.json(data, { status: backendResponse.status });
    } else {
      const textError = await backendResponse.text();
      return NextResponse.json({ error: "Backend server did not return valid JSON.", details: textError }, { status: 500 });
    }

  } catch (error: any) {
    console.error("❌ Next.js Edge Bridge Crash:", error);
    return NextResponse.json(
      { error: "Could not establish an active network link with Express on port 5000.", details: error.message },
      { status: 500 }
    );
  }
}