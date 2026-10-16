import { NextRequest, NextResponse } from "next/server";
import { processPrescriptionFile } from "@/lib/geminiPrescriptionScanner";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "Please upload a prescription image file to analyze."
        },
        { status: 400 }
      );
    }

    const result = await processPrescriptionFile(file);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "Prescription analysis failed";

    return NextResponse.json(
      {
        success: false,
        error: errMessage
      },
      { status: 500 }
    );
  }
}
