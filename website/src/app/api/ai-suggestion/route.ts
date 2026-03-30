import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ScoredProperty } from "@/lib/scoring";

const SYSTEM_PROMPT = `You are an AI real estate investment analyst.

RULES:
- Use ONLY the provided property data
- Do NOT invent prices, yields, or growth
- Be balanced and professional
- Clearly explain risks
- No financial guarantees
- Australian real estate context

OUTPUT STRUCTURE:
1. Summary of Recommended Properties
2. Pros and Cons (bullet points)
3. Investment Reasoning (or Living Suitability if purpose is "live")
4. Risk Explanation
5. Final Suggestion

Format your response in clean markdown with headers and bullet points.`;

interface SuggestionRequest {
  properties: ScoredProperty[];
  userProfile: {
    budgetRange: [number, number];
    preferredSuburbs: string[];
    propertyType: string;
    purpose: string;
    minBedrooms: number;
  };
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "AI suggestions are currently unavailable. Please configure a Gemini API key.",
        },
        { status: 503 }
      );
    }

    const body: SuggestionRequest = await request.json();
    const { properties, userProfile } = body;

    if (!properties || properties.length === 0) {
      return NextResponse.json(
        { error: "No properties provided for analysis." },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const purposeContext =
      userProfile.purpose === "live"
        ? "The user is looking for a property to LIVE in. Focus on comfort, safety, neighbourhood quality, and lifestyle factors."
        : userProfile.purpose === "invest"
          ? "The user is looking for an INVESTMENT property. Focus on rental yield, capital growth potential, and return on investment."
          : "The user has not specified a purpose. Provide balanced advice for both living and investment.";

    const prompt = `${SYSTEM_PROMPT}

${purposeContext}

User Profile:
${JSON.stringify(userProfile, null, 2)}

Recommended Properties:
${JSON.stringify(
  properties.map((p) => ({
    address: p.address,
    suburb: p.suburb,
    price: p.price,
    property_type: p.property_type,
    bedrooms: p.bedrooms,
    rent_estimate: p.rent_estimate,
    land_size: p.land_size,
    yield_score: Math.round(p.yield_score * 100) / 100,
    growth_score: p.growth_score,
    risk_score: p.risk_score,
    final_score: Math.round(p.final_score * 1000) / 1000,
  })),
  null,
  2
)}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ suggestion: text });
  } catch {
    return NextResponse.json(
      {
        error:
          "Unable to generate AI suggestions at the moment. Please try again later.",
      },
      { status: 500 }
    );
  }
}
