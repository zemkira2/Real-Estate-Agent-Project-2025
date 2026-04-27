import { NextRequest, NextResponse } from "next/server";
import { loadProperties } from "@/lib/properties";
import { filterProperties, rankProperties, getAllSuburbs } from "@/lib/scoring";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const budgetMin = Number(searchParams.get("budgetMin") || 0);
    const budgetMax = Number(searchParams.get("budgetMax") || 2000000);
    const propertyType = searchParams.get("propertyType") || "Any";
    const suburbs = searchParams.get("suburbs")
      ? searchParams.get("suburbs")!.split(",")
      : [];
    const minBedrooms = Number(searchParams.get("minBedrooms") || 0);
    const purpose = (searchParams.get("purpose") || "any") as "invest" | "live" | "any";
    const topN = Number(searchParams.get("topN") || 5);

    const allProperties = await loadProperties(suburbs);
    const filtered = filterProperties(allProperties, {
      budgetMin,
      budgetMax,
      propertyType,
      suburbs,
      minBedrooms,
      purpose,
    });

    if (filtered.length === 0) {
      return NextResponse.json({
        properties: [],
        allSuburbs: getAllSuburbs(),
        message: "No properties match your criteria. Try widening your search.",
      });
    }

    const ranked = rankProperties(filtered, topN, purpose);

    return NextResponse.json({
      properties: ranked,
      totalMatches: filtered.length,
      allSuburbs: getAllSuburbs(),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load properties. Please try again later." },
      { status: 500 }
    );
  }
}
