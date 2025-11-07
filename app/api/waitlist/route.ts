import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Append environment variables
    const payload = {
      ...data,
      SpreadsheetId: process.env.NEXT_SHEETID,
      SheetName: process.env.NEXT_GID, // GID or sheet name
    };

    const response = await fetch(
      process.env.NEXT_GOOGLE_SCRIPT_WEBAPP_URL!,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    // Check if the response is ok
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Google Script error: ${text}`);
    }

    // Parse JSON safely
    let result;
    try {
      result = await response.json();
    } catch (err) {
      result = await response.text(); // fallback if not JSON
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Error posting to Google Sheet:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit", details: (error as Error).message },
      { status: 500 }
    );
  }
}
