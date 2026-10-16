import { NextRequest, NextResponse } from "next/server";
import { processPrescriptionFile } from "@/lib/geminiPrescriptionScanner";
import { enrichMedicinesWithBuyingOptions } from "@/lib/serpShoppingService";

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

    const latStr = formData.get("latitude") as string | null;
    const lonStr = formData.get("longitude") as string | null;
    const latitude = latStr ? parseFloat(latStr) : undefined;
    const longitude = lonStr ? parseFloat(lonStr) : undefined;

    const userGeo =
      latitude !== undefined && longitude !== undefined && !isNaN(latitude) && !isNaN(longitude)
        ? { latitude, longitude }
        : undefined;

    if (result && result.medicines && result.medicines.length > 0) {
      result.medicines = await enrichMedicinesWithBuyingOptions(result.medicines, userGeo);
    }

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
