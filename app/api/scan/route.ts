import { NextRequest, NextResponse } from "next/server";
import { enrichMedicinesWithBuyingOptions } from "@/lib/serpShoppingService";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let medicines: any[] = [];
    let latitude: number | undefined;
    let longitude: number | undefined;

    if (contentType.includes("application/json")) {
      const body = await req.json();
      medicines = body.medicines || [];
      latitude = body.latitude;
      longitude = body.longitude;
    } else {
      const formData = await req.formData();
      const medsJson = formData.get("medicines");
      if (typeof medsJson === "string") {
        try {
          medicines = JSON.parse(medsJson);
        } catch {}
      }
      const lat = formData.get("latitude");
      const lon = formData.get("longitude");
      latitude = typeof lat === "string" ? parseFloat(lat) : undefined;
      longitude = typeof lon === "string" ? parseFloat(lon) : undefined;
    }

    const userGeo =
      latitude !== undefined &&
      longitude !== undefined &&
      !isNaN(latitude) &&
      !isNaN(longitude)
        ? { latitude, longitude }
        : undefined;

    if (Array.isArray(medicines) && medicines.length > 0) {
      const enriched = await enrichMedicinesWithBuyingOptions(
        medicines,
        userGeo
      );
      return NextResponse.json({ success: true, data: enriched });
    }

    return NextResponse.json({ success: true, data: [] });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Medicine pricing lookup failed.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
