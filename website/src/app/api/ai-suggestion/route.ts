import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ScoredProperty } from "@/lib/scoring";

const SYSTEM_PROMPT = `You are a senior Australian real estate analyst specialising in the Victorian property market.

STRICT RULES:
- Use ONLY the numbers in the provided data. Never invent prices, yields, or suburb facts.
- Calculate gross yield as: (weekly_rent × 52) ÷ price × 100. Use this exact figure — do not guess.
- Be specific and insightful. Avoid generic filler phrases.
- No financial guarantees or personalised financial advice.
- Write in plain, professional Australian English.

YOUR TASK:
Produce a thorough property analysis report covering the top properties for living and for investment. Each property entry must include real numbers, practical pros/cons, and honest risk commentary. Close with suburb-level context and a tailored recommendation.

OUTPUT FORMAT — use exactly these markdown sections:

## Top Picks for Living

For each of the 3 best properties for living, use this sub-structure:

### [Address], [Suburb]
**[Property type] · [bedrooms] bed · [bathrooms] bath · $[price formatted]**

**Why it suits living:** 2–3 sentences. Mention suburb character, safety (use risk_score), space (land size), bedrooms relative to family needs, and any school or hospital proximity implied by the suburb data.

**Strengths:**
- bullet points (at least 3) — specific to this property's data

**Considerations:**
- bullet points (1–2) — honest trade-offs or limitations based on data

**Best suited for:** one sentence describing the ideal buyer profile (e.g. young family, downsizer, professional couple).

---

## Top Picks for Investment

For each of the 3 best properties for investment, use this sub-structure:

### [Address], [Suburb]
**[Property type] · [bedrooms] bed · $[price formatted] · Gross yield: [calculated]%**

**Investment case:** 2–3 sentences. Reference the gross yield %, annual rental income ($weekly × 52), growth_score, and what drives demand in this suburb.

**Financial snapshot:**
- Gross rental yield: X.X%
- Est. annual rental income: $XX,XXX
- Capital growth score: X/10
- Risk score: X/10 (explain briefly what drives it)

**Growth outlook:** 1–2 sentences on capital growth potential based on suburb category and land size.

**Key risks:**
- bullet points (1–2) based on risk_score and suburb type

---

## Suburb Insights

A short paragraph (3–5 sentences) covering patterns across the suburbs in this property set. Highlight which suburb types (city/regional) are represented, what that means for yield vs growth trade-offs, and any notable risk concentrations.

---

## Our Recommendation

3–5 sentences directly addressing the user's stated purpose. Name 1–2 specific properties with their address. Explain why they are the best match given the user's budget, bedroom requirement, and purpose. If purpose is "any", recommend one for each goal.`;

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

function formatCurrency(n: number): string {
  return n.toLocaleString("en-AU");
}

function buildPrompt(
  properties: ScoredProperty[],
  userProfile: SuggestionRequest["userProfile"]
): string {
  const purposeLabel =
    userProfile.purpose === "live"
      ? "LIVE IN — prioritise comfort, safety, lifestyle, schools, and space"
      : userProfile.purpose === "invest"
        ? "INVEST — prioritise rental yield, capital growth, and low risk"
        : "ANY — provide balanced analysis for both living and investment";

  const propertyRows = properties.map((p) => {
    const annualRent = p.rent_estimate * 52;
    const grossYield = ((annualRent / p.price) * 100).toFixed(2);
    return {
      address: p.address,
      suburb: p.suburb,
      price: `$${formatCurrency(p.price)}`,
      property_type: p.property_type,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      land_size_sqm: p.land_size,
      weekly_rent_estimate: `$${p.rent_estimate}`,
      annual_rent_estimate: `$${formatCurrency(annualRent)}`,
      gross_yield_pct: `${grossYield}%`,
      yield_score: Math.round(p.yield_score * 10) / 10,
      growth_score: p.growth_score,
      risk_score: p.risk_score,
      final_score: Math.round(p.final_score * 100) / 100,
    };
  });

  return `${SYSTEM_PROMPT}

---

USER PROFILE:
- Purpose: ${purposeLabel}
- Budget range: $${formatCurrency(userProfile.budgetRange[0])} – $${formatCurrency(userProfile.budgetRange[1])}
- Minimum bedrooms: ${userProfile.minBedrooms || "no preference"}
- Property type preference: ${userProfile.propertyType}
- Preferred suburbs: ${userProfile.preferredSuburbs.length > 0 ? userProfile.preferredSuburbs.join(", ") : "no preference — open to all"}

PROPERTIES TO ANALYSE (${properties.length} properties, sorted by final score descending):
${JSON.stringify(propertyRows, null, 2)}

SCORE GUIDE:
- yield_score 0–10: higher = better rental return (already pre-calculated as gross_yield_pct)
- growth_score 0–10: higher = stronger capital growth potential (driven by suburb type and land size)
- risk_score 0–10: higher = MORE risk (flood-prone, bushfire zone, or industrial area)
- final_score: weighted combination used for ranking`;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "AI analysis is not configured. Add a GEMINI_API_KEY to .env.local (free at aistudio.google.com).",
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
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 8192,
      },
    });

    const prompt = buildPrompt(properties.slice(0, 20), userProfile);
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ suggestion: text });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("AI suggestion error:", msg);

    if (msg.includes("429") || msg.includes("quota")) {
      return NextResponse.json(
        { error: "Rate limit reached. Please wait a moment and try again." },
        { status: 429 }
      );
    }
    if (msg.includes("API_KEY") || msg.includes("403")) {
      return NextResponse.json(
        { error: "Invalid Gemini API key. Check GEMINI_API_KEY in .env.local." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      {
        error:
          "Unable to generate AI analysis right now. Please try again later.",
      },
      { status: 500 }
    );
  }
}
