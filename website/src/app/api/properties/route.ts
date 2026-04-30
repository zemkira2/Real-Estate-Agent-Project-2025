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
      ? searchParams.get("suburbs")!.split("|")
      : [];
    const minBedrooms = Number(searchParams.get("minBedrooms") || 0);
    const purpose = (searchParams.get("purpose") || "any") as "invest" | "live" | "any";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 20)));

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
        totalMatches: 0,
        totalPages: 0,
        currentPage: 1,
        allSuburbs: getAllSuburbs(),
        message: "No properties match your criteria. Try widening your search.",
      });
    }

    const ranked = rankProperties(filtered, filtered.length, purpose);
    const totalPages = Math.ceil(ranked.length / pageSize);
    const start = (page - 1) * pageSize;
    const pageResults = ranked.slice(start, start + pageSize);

    return NextResponse.json({
      properties: pageResults,
      totalMatches: filtered.length,
      totalPages,
      currentPage: page,
      allSuburbs: getAllSuburbs(),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load properties. Please try again later." },
      { status: 500 }
    );
  }
}
