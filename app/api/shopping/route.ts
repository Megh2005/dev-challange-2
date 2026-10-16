import { NextRequest, NextResponse } from "next/server";
import { fetchMedicineBuyingOptions } from "@/lib/serpShoppingService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const generic = searchParams.get("generic") || undefined;

    if (!query) {
      return NextResponse.json(
        { success: false, error: "Medicine name query parameter 'q' is required." },
        { status: 400 }
      );
    }

    const latParam = searchParams.get("lat");
    const lonParam = searchParams.get("lon");
    const latitude = latParam ? parseFloat(latParam) : undefined;
    const longitude = lonParam ? parseFloat(lonParam) : undefined;

    const userGeo =
      latitude !== undefined && longitude !== undefined && !isNaN(latitude) && !isNaN(longitude)
        ? { latitude, longitude }
        : undefined;

    const options = await fetchMedicineBuyingOptions(query, generic, userGeo);

    return NextResponse.json({
      success: true,
      data: options
    });
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "Failed to fetch shopping options";

    return NextResponse.json(
      { success: false, error: errMessage },
      { status: 500 }
    );
  }
}
