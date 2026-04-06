import { NextRequest, NextResponse } from "next/server";
import { loadProperties, searchLiveProperties } from "@/lib/properties";
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
    const live = searchParams.get("live") === "true";

    let allProperties;
    let dataSource: string;

    if (live) {
      // Live search directly against Domain API
      allProperties = await searchLiveProperties({
        minPrice: budgetMin > 0 ? budgetMin : undefined,
        maxPrice: budgetMax < 2000000 ? budgetMax : undefined,
        minBedrooms: minBedrooms > 0 ? minBedrooms : undefined,
        propertyTypes:
          propertyType !== "Any"
            ? [propertyType === "House" ? "House" : "ApartmentUnitFlat"]
            : undefined,
        suburbs: suburbs.length > 0 ? suburbs : undefined,
      });
      dataSource = "domain-live";
    } else {
      allProperties = await loadProperties();
      dataSource = "domain-cache";
    }

    const filtered = live
      ? rankProperties(allProperties, topN, purpose)
      : (() => {
          const f = filterProperties(allProperties, {
            budgetMin,
            budgetMax,
            propertyType,
            suburbs,
            minBedrooms,
            purpose,
          });
          return f.length === 0 ? f : rankProperties(f, topN, purpose);
        })();

    if (filtered.length === 0) {
      return NextResponse.json(
        {
          properties: [],
          allSuburbs: getAllSuburbs(),
          dataSource,
          message: "No properties match your criteria. Try widening your search.",
        },
        { headers: { "X-Data-Source": dataSource } }
      );
    }

    return NextResponse.json(
      {
        properties: filtered,
        totalMatches: allProperties.length,
        allSuburbs: getAllSuburbs(),
        dataSource,
      },
      { headers: { "X-Data-Source": dataSource } }
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to load properties. Please try again later." },
      { status: 500 }
    );
  }
}
