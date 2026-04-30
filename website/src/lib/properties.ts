import { Property, ScoredProperty, addScores, getPropertyImage, getSuburbAmenities } from "./scoring";
import { getSuburbInfo } from "./suburbs";

const RAPIDAPI_HOST = "realty-base-au.p.rapidapi.com";

// Default suburbs searched when the user hasn't selected any — broad Melbourne coverage
const DEFAULT_SUBURBS = [
  // Inner city & surrounds
  "Melbourne, VIC", "Carlton, VIC", "Fitzroy, VIC", "Collingwood, VIC",
  "Richmond, VIC", "South Yarra, VIC", "St Kilda, VIC", "Prahran, VIC",
  // Inner north
  "Brunswick, VIC", "Coburg, VIC", "Preston, VIC", "Reservoir, VIC",
  // Inner east
  "Hawthorn, VIC", "Kew, VIC", "Camberwell, VIC", "Box Hill, VIC",
  // Inner west
  "Footscray, VIC", "Essendon, VIC", "Sunshine, VIC",
  // South east
  "Dandenong, VIC", "Frankston, VIC", "Springvale, VIC",
  // West
  "Werribee, VIC", "Point Cook, VIC",
  // Regional
  "Geelong, VIC", "Ballarat, VIC", "Bendigo, VIC",
];

// In-memory cache keyed by suburb name
const suburbCache = new Map<string, { props: ScoredProperty[]; ts: number }>();
// Global property lookup populated on every fetch
const propertyMap = new Map<number, ScoredProperty>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Parse price strings like "$1,375,000" or "$800,000 - $880,000"
function parsePrice(display: string): number {
  if (!display) return 0;
  const parts = display.split(" - ");
  const vals = parts.map((p) => parseInt(p.replace(/[$,\s]/g, ""), 10) || 0);
  return vals.length === 2 ? Math.round((vals[0] + vals[1]) / 2) : vals[0];
}

// Estimate weekly rent from sold price using typical Melbourne gross yields
function estimateWeeklyRent(price: number, rawType: string): number {
  const rate = rawType === "house" ? 0.028 : 0.038;
  return Math.round((price * rate) / 52);
}

// Fallback land-size estimate when the API doesn't include it (e.g. apartments)
function estimateLandSize(rawType: string): number {
  return rawType === "house" ? 450 : 80;
}

function getLandSize(raw: any, rawType: string): number {
  const apiValue = raw.landSize?.value;
  if (typeof apiValue === "number" && apiValue > 0) return apiValue;
  return estimateLandSize(rawType);
}

// The reastatic CDN (i3.au.reastatic.net) requires authenticated session cookies
// from realestate.com.au and cannot be accessed server-side. Fall back to
// deterministic Unsplash stock photos keyed by property id and type.
function buildImageUrl(_raw: any, id: number, displayType: string): string {
  return getPropertyImage(id, displayType);
}

function mapApiListing(raw: any, idx: number, schoolCount: number): Property | null {
  const price = parsePrice(raw.price?.display || "");
  if (!price || price < 50_000) return null;

  const rawType: string = raw.propertyType || "unit";
  const displayType = rawType === "house" ? "House" : "Unit";
  const id = parseInt(raw.listingId, 10) || idx;
  const bedrooms: number =
    raw.generalFeatures?.bedrooms?.value ??
    raw.features?.general?.bedrooms ??
    0;

  if (!bedrooms) return null; // skip commercial/unspecified listings

  const bathrooms: number =
    raw.generalFeatures?.bathrooms?.value ??
    raw.features?.general?.bathrooms ??
    0;

  const parking: number =
    raw.generalFeatures?.carspaces?.value ??
    raw.features?.general?.parkingSpaces ??
    0;

  return {
    id,
    price,
    rent_estimate: estimateWeeklyRent(price, rawType),
    property_type: displayType,
    address: raw.address?.streetAddress || "",
    suburb: raw.address?.suburb || "",
    land_size: getLandSize(raw, rawType),
    bedrooms,
    bathrooms,
    parking,
    nearby_schools: schoolCount,
    image: buildImageUrl(raw, id, displayType),
  };
}

async function fetchSuburb(suburbKey: string): Promise<ScoredProperty[]> {
  const info = getSuburbInfo(suburbKey);
  if (!info) return [];

  const cached = suburbCache.get(suburbKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.props;

  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    console.warn("RAPIDAPI_KEY is not set");
    return [];
  }

  const locationId = `suburb:${info.suburb}, ${info.state} ${info.postcode}`;
  const url =
    `https://${RAPIDAPI_HOST}/properties/search` +
    `?locationId=${encodeURIComponent(locationId)}&pageSize=25`;

  try {
    const res = await fetch(url, {
      headers: {
        "x-rapidapi-key": key,
        "x-rapidapi-host": RAPIDAPI_HOST,
      },
      next: { revalidate: 600 },
    });

    if (!res.ok) return [];
    const json = await res.json();
    if (!json.status || !Array.isArray(json.data)) return [];

    // Fetch real nearby school count using first property's coordinates
    let schoolCount = getSuburbAmenities(info.suburb).schools; // hardcoded fallback
    const firstWithCoords = json.data.find(
      (r: any) => r.address?.location?.latitude && r.address?.location?.longitude
    );
    if (firstWithCoords) {
      const { latitude, longitude } = firstWithCoords.address.location;
      try {
        const schoolRes = await fetch(
          `https://school-service.realestate.com.au/closest_by_type/?lat=${latitude}&lon=${longitude}&count=20`,
          { next: { revalidate: 86400 } }
        );
        if (schoolRes.ok) {
          const schoolData = await schoolRes.json();
          schoolCount = (schoolData.all as any[] ?? []).filter(
            (s) => s.distance?.value <= 2000
          ).length;
        }
      } catch {
        // keep hardcoded fallback
      }
    }

    const props: Property[] = json.data
      .map((r: any, i: number) => mapApiListing(r, i, schoolCount))
      .filter(Boolean) as Property[];

    const scored = addScores(props);
    suburbCache.set(suburbKey, { props: scored, ts: Date.now() });
    scored.forEach((p) => propertyMap.set(p.id, p));
    return scored;
  } catch (err) {
    console.error(`Failed to fetch suburb ${suburbKey}:`, err);
    return [];
  }
}

export async function loadProperties(
  suburbs?: string[]
): Promise<ScoredProperty[]> {
  let targets =
    suburbs && suburbs.length > 0
      ? suburbs.filter((s) => getSuburbInfo(s))
      : DEFAULT_SUBURBS;

  if (targets.length === 0) targets = DEFAULT_SUBURBS;

  const results = await Promise.all(targets.map(fetchSuburb));
  return results.flat();
}

export async function getPropertyById(
  id: number
): Promise<ScoredProperty | undefined> {
  const key = process.env.RAPIDAPI_KEY;
  if (key) {
    try {
      const res = await fetch(
        `https://${RAPIDAPI_HOST}/properties/details?listingId=${id}`,
        {
          headers: {
            "x-rapidapi-key": key,
            "x-rapidapi-host": RAPIDAPI_HOST,
          },
          next: { revalidate: 300 },
        }
      );
      if (res.ok) {
        const json = await res.json();
        if (json.status && json.data) {
          const raw = json.data;

          // Get real school count from school-service using property coordinates
          let schoolCount = 0;
          const loc = raw.address?.location;
          if (loc?.latitude && loc?.longitude) {
            try {
              const schoolRes = await fetch(
                `https://school-service.realestate.com.au/closest_by_type/?lat=${loc.latitude}&lon=${loc.longitude}&count=20`,
                { next: { revalidate: 86400 } }
              );
              if (schoolRes.ok) {
                const schoolData = await schoolRes.json();
                schoolCount = (schoolData.all as any[] ?? []).filter(
                  (s: any) => s.distance?.value <= 2000
                ).length;
              }
            } catch {}
          }

          const property = mapApiListing(raw, id, schoolCount);
          if (property) {
            property.description = raw.description || "";
            property.agent_name =
              raw.lister?.name || raw.listers?.[0]?.name || "";
            property.agent_phone =
              raw.lister?.phoneNumber ||
              raw.lister?.mobilePhoneNumber ||
              raw.listers?.[0]?.phoneNumber ||
              "";
            property.agency_name = raw.agency?.name || "";
            property.agency_phone = raw.agency?.phoneNumber || "";
            property.realestate_url = raw._links?.prettyUrl?.href || "";

            const [scored] = addScores([property]);
            propertyMap.set(id, scored);
            return scored;
          }
        }
      }
    } catch (err) {
      console.error(`Failed to fetch property detail ${id}:`, err);
    }
  }

  // Fallback: use cached list data
  if (propertyMap.has(id)) return propertyMap.get(id)!;
  await loadProperties();
  return propertyMap.get(id);
}
