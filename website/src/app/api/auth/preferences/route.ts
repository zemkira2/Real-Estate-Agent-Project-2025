import { NextResponse } from "next/server";
import { getCurrentUser, saveUserPreferences, UserPreferences } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const body: UserPreferences = await request.json();

    const preferences: UserPreferences = {
      purpose: body.purpose ?? "any",
      budgetMin: Number(body.budgetMin) || 300000,
      budgetMax: Number(body.budgetMax) || 1500000,
      propertyType: body.propertyType || "Any",
      minBedrooms: Number(body.minBedrooms) || 0,
      suburbs: Array.isArray(body.suburbs) ? body.suburbs : [],
    };

    await saveUserPreferences(user.id, preferences);
    return NextResponse.json({ success: true, preferences });
  } catch {
    return NextResponse.json({ error: "Failed to save preferences." }, { status: 500 });
  }
}
