import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { base64Data, mimeType, availableTags, apiKey } = await request.json();

    if (!base64Data || !mimeType) {
      return NextResponse.json({ error: "Missing image data assets" }, { status: 400 });
    }

    const targetApiKey = apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!targetApiKey) {
      return NextResponse.json({ error: "API Key allocation missing." }, { status: 400 });
    }

    const prompt = `Analyze this face image. Identify facial structure, accessories, hair, expressions, or clothes. 
    From this list of available database system tags: [${availableTags.join(", ")}], pick the top matching tags that describe this person. 
    Return strictly a valid JSON object only. Do not wrap the response in markdown blocks or backticks. 
    Format structure exactly: {"matchedTags": ["tag1", "tag2"], "confidence": "94%"}`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${targetApiKey}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inlineData: { data: base64Data, mimeType: mimeType } },
            { text: prompt }
          ]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Gemini Upstream Error: ${response.status} - ${errorText}` }, { status: response.status });
    }

    const resultData = await response.json();
    let rawText = resultData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    // Clean up unwanted markdown backticks if present
    if (rawText.includes("```")) {
      rawText = rawText.replace(/```json/g, "").replace(/```/g, "");
    }

    const parsedOutput = JSON.parse(rawText.trim());
    return NextResponse.json(parsedOutput);

  } catch (error: any) {
    console.error("API Route Processing Failure:", error);
    return NextResponse.json({ error: error.message || "Internal execution dropped." }, { status: 500 });
  }
}