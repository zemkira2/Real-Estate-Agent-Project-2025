import { NextRequest, NextResponse } from "next/server";
import { getPropertyById } from "@/lib/properties";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Property not found." },
        { status: 404 }
      );
    }

    const property = getPropertyById(id);
    if (!property) {
      return NextResponse.json(
        { error: "Property not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ property });
  } catch {
    return NextResponse.json(
      { error: "Unable to load property details. Please try again." },
      { status: 500 }
    );
  }
}
