export interface Property {
  price: number;
  rent_estimate: number;
  property_type: string;
  address: string;
  suburb: string;
  land_size: number;
  bedrooms: number;
}

export interface ScoredProperty extends Property {
  yield_score: number;
  growth_score: number;
  risk_score: number;
  final_score: number;
}

const CITY_SUBURBS = [
  "Richmond", "Fitzroy", "St Kilda", "Carlton", "Brunswick",
  "Frankston", "Werribee", "Dandenong", "Sunshine", "Box Hill",
  "Essendon", "Preston", "Reservoir", "South Yarra", "Toorak",
  "Hawthorn", "Footscray",
];

const REGIONAL_SUBURBS = [
  "Geelong", "Ballarat", "Bendigo", "Shepparton",
  "Mildura", "Warrnambool", "Traralgon", "Echuca",
];

const FLOOD_PRONE_SUBURBS = ["Shepparton", "Warrnambool", "Traralgon"];
const BUSHFIRE_RISK_SUBURBS = ["Mildura", "Echuca", "Shepparton", "Ballarat", "Bendigo"];
const INDUSTRIAL_ZONES = ["Sunshine", "Dandenong", "Werribee", "Footscray"];

function rentalYieldScore(row: Property): number {
  const yieldValue = (row.rent_estimate * 52) / row.price;
  return Math.min(10, Math.max(0, yieldValue * 100));
}

function capitalGrowthScore(row: Property): number {
  let score = 0;
  if (row.land_size > 800) score += 4;
  else if (row.land_size > 600) score += 2;

  if (CITY_SUBURBS.includes(row.suburb)) score += 5;
  else if (REGIONAL_SUBURBS.includes(row.suburb)) score += 3;

  return Math.min(score, 10);
}

function riskScore(row: Property): number {
  let score = 0;
  if (FLOOD_PRONE_SUBURBS.includes(row.suburb)) score += 5;
  if (BUSHFIRE_RISK_SUBURBS.includes(row.suburb)) score += 3;
  if (INDUSTRIAL_ZONES.includes(row.suburb)) score += 2;
  return score;
}

export function addScores(properties: Property[]): ScoredProperty[] {
  return properties.map((p) => {
    const ys = rentalYieldScore(p);
    const gs = capitalGrowthScore(p);
    const rs = riskScore(p);
    return {
      ...p,
      yield_score: ys,
      growth_score: gs,
      risk_score: rs,
      final_score: 0.4 * gs + 0.4 * ys - 0.2 * rs,
    };
  });
}

export interface FilterOptions {
  budgetMin: number;
  budgetMax: number;
  propertyType: string;
  suburbs: string[];
  minBedrooms: number;
  purpose: "invest" | "live" | "any";
}

export function filterProperties(
  properties: ScoredProperty[],
  options: FilterOptions
): ScoredProperty[] {
  let filtered = properties.filter(
    (p) =>
      p.price >= options.budgetMin &&
      p.price <= options.budgetMax &&
      p.bedrooms >= options.minBedrooms
  );

  if (options.propertyType !== "Any") {
    filtered = filtered.filter((p) => p.property_type === options.propertyType);
  }

  if (options.suburbs.length > 0) {
    filtered = filtered.filter((p) => options.suburbs.includes(p.suburb));
  }

  return filtered;
}

export function rankProperties(
  properties: ScoredProperty[],
  topN: number = 5,
  purpose: "invest" | "live" | "any" = "any"
): ScoredProperty[] {
  const scored = properties.map((p) => {
    let score = p.final_score;
    if (purpose === "invest") {
      // Higher weight on yield and growth for investors
      score = 0.45 * p.growth_score + 0.45 * p.yield_score - 0.1 * p.risk_score;
    } else if (purpose === "live") {
      // For living: prioritise low risk, more bedrooms, lower price
      score =
        0.2 * p.growth_score +
        0.2 * p.yield_score -
        0.4 * p.risk_score +
        0.2 * Math.min(10, p.bedrooms * 2);
    }
    return { ...p, final_score: score };
  });

  return scored
    .sort((a, b) => b.final_score - a.final_score)
    .slice(0, topN);
}

export function getAllSuburbs(): string[] {
  return [...CITY_SUBURBS, ...REGIONAL_SUBURBS].sort();
}
