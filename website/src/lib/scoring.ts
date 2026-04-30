import { getAllSuburbKeys } from "./suburbs";

export interface Property {
  id: number;
  price: number;
  rent_estimate: number;
  property_type: string;
  address: string;
  suburb: string;
  land_size: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  nearby_schools: number;
  image: string;
  // Detail-only fields (populated when fetching by listing ID)
  description?: string;
  agent_name?: string;
  agent_phone?: string;
  agency_name?: string;
  agency_phone?: string;
  realestate_url?: string;
}

interface SuburbAmenities {
  schools: number;
  hospital: boolean;
}

const SUBURB_AMENITIES: Record<string, SuburbAmenities> = {
  Richmond:      { schools: 5,  hospital: true  },
  Fitzroy:       { schools: 4,  hospital: true  },
  "St Kilda":    { schools: 3,  hospital: false },
  Carlton:       { schools: 6,  hospital: true  },
  Brunswick:     { schools: 7,  hospital: false },
  Frankston:     { schools: 8,  hospital: true  },
  Werribee:      { schools: 6,  hospital: true  },
  Dandenong:     { schools: 9,  hospital: true  },
  Sunshine:      { schools: 7,  hospital: true  },
  "Box Hill":    { schools: 8,  hospital: true  },
  Essendon:      { schools: 9,  hospital: false },
  Preston:       { schools: 7,  hospital: false },
  Reservoir:     { schools: 8,  hospital: false },
  "South Yarra": { schools: 4,  hospital: false },
  Toorak:        { schools: 5,  hospital: false },
  Hawthorn:      { schools: 6,  hospital: false },
  Footscray:     { schools: 6,  hospital: true  },
  Geelong:       { schools: 15, hospital: true  },
  Ballarat:      { schools: 12, hospital: true  },
  Bendigo:       { schools: 12, hospital: true  },
  Shepparton:    { schools: 10, hospital: true  },
  Mildura:       { schools: 8,  hospital: true  },
  Warrnambool:   { schools: 7,  hospital: true  },
  Traralgon:     { schools: 8,  hospital: true  },
  Echuca:        { schools: 5,  hospital: true  },
};

export function getSuburbAmenities(suburb: string): SuburbAmenities {
  return SUBURB_AMENITIES[suburb] ?? { schools: 3, hospital: false };
}

export interface ScoredProperty extends Property {
  yield_score: number;
  growth_score: number;
  risk_score: number;
  final_score: number;
}

// Deterministic house images based on property id
const HOUSE_IMAGES = [
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=600&h=400&fit=crop",
];

const UNIT_IMAGES = [
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=600&h=400&fit=crop",
];

export function getPropertyImage(id: number, propertyType: string): string {
  const images = propertyType === "House" ? HOUSE_IMAGES : UNIT_IMAGES;
  return images[id % images.length];
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
    // options.suburbs are "Suburb, STATE" keys; p.suburb is the bare suburb name from the API
    const suburbNames = new Set(
      options.suburbs.map((s) => s.split(", ")[0].trim().toLowerCase())
    );
    filtered = filtered.filter((p) =>
      suburbNames.has(p.suburb.trim().toLowerCase())
    );
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
  return getAllSuburbKeys();
}
