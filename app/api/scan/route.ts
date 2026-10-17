import { NextRequest, NextResponse } from "next/server";
import { processPrescriptionFile } from "@/lib/geminiPrescriptionScanner";
import { enrichMedicinesWithBuyingOptions } from "@/lib/serpShoppingService";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Please upload a prescription image file." },
        { status: 400 }
      );
    }

    const result = await processPrescriptionFile(file);

    const lat = formData.get("latitude");
    const lon = formData.get("longitude");
    const latitude = typeof lat === "string" ? parseFloat(lat) : undefined;
    const longitude = typeof lon === "string" ? parseFloat(lon) : undefined;

    const userGeo =
      latitude !== undefined && longitude !== undefined && !isNaN(latitude) && !isNaN(longitude)
        ? { latitude, longitude }
        : undefined;

    if (result?.medicines?.length) {
      result.medicines = await enrichMedicinesWithBuyingOptions(result.medicines, userGeo);
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Prescription analysis failed.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
