import { NextRequest, NextResponse } from "next/server";
import { analyzeLabReportFile } from "@/lib/geminiLabReportAnalyzer";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Please upload a pathology or lab report image to analyze." },
        { status: 400 }
      );
    }

    const result = await analyzeLabReportFile(file);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Pathology report analysis failed. Please try again.";
    console.error("Lab report analysis error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
