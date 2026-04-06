import { parse } from "csv-parse/sync";
import fs from "fs";
import path from "path";
import { Property, addScores, ScoredProperty, getPropertyImage } from "./scoring";
import { hasDomainCredentials, searchListings, DomainSearchParams } from "./domain-api";
import { mapDomainListings } from "./domain-mapper";
import {
  getCachedProperties,
  writeCacheProperties,
  isCacheStale,
} from "./property-cache";

// In-memory cache
let cachedProperties: ScoredProperty[] | null = null;
let cacheTimestamp: number = 0;
const MEMORY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// CSV fallback loader
function loadPropertiesFromCsv(): ScoredProperty[] {
  const csvPath = path.join(process.cwd(), "public", "data", "vic_properties_1000.csv");
  const csvContent = fs.readFileSync(csvPath, "utf-8");

  const records: Property[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    cast: (value, context) => {
      if (context.header) return value;
      const numericColumns = ["price", "rent_estimate", "land_size", "bedrooms"];
      if (numericColumns.includes(String(context.column))) {
        return Number(value);
      }
      return value;
    },
  }).map((row: Omit<Property, "id" | "image">, index: number) => ({
    ...row,
    id: index,
    image: getPropertyImage(index, row.property_type),
  }));

  return addScores(records);
}

// Fetch from Domain API and cache results
async function fetchFromDomain(): Promise<ScoredProperty[] | null> {
  try {
    const listings = await searchListings({ pageSize: 200 });
    if (listings.length === 0) return null;

    const properties = mapDomainListings(listings);
    if (properties.length === 0) return null;

    // Write to file cache for persistence
    writeCacheProperties(properties);

    return addScores(properties);
  } catch (err) {
    console.error("Domain API fetch failed:", err);
    return null;
  }
}

// Load from file cache
function loadFromFileCache(): ScoredProperty[] | null {
  const cached = getCachedProperties();
  if (cached.length === 0) return null;
  return addScores(cached);
}

/**
 * Load properties with fallback chain:
 * 1. In-memory cache (if fresh)
 * 2. Domain API (if credentials exist and file cache is stale)
 * 3. File cache (domain-cache.json)
 * 4. CSV fallback (vic_properties_1000.csv)
 */
export async function loadProperties(): Promise<ScoredProperty[]> {
  // 1. Return in-memory cache if fresh
  if (cachedProperties && Date.now() - cacheTimestamp < MEMORY_CACHE_TTL) {
    return cachedProperties;
  }

  // 2. Try Domain API if credentials exist and file cache is stale
  if (hasDomainCredentials() && isCacheStale()) {
    const domainData = await fetchFromDomain();
    if (domainData) {
      cachedProperties = domainData;
      cacheTimestamp = Date.now();
      return cachedProperties;
    }
  }

  // 3. Try file cache
  if (hasDomainCredentials()) {
    const fileCached = loadFromFileCache();
    if (fileCached) {
      cachedProperties = fileCached;
      cacheTimestamp = Date.now();
      return cachedProperties;
    }
  }

  // 4. CSV fallback
  cachedProperties = loadPropertiesFromCsv();
  cacheTimestamp = Date.now();
  return cachedProperties;
}

/**
 * Live search against Domain API — bypasses cache for fresh results.
 * Results are also written to the cache to build up local data.
 */
export async function searchLiveProperties(
  params: DomainSearchParams
): Promise<ScoredProperty[]> {
  if (!hasDomainCredentials()) {
    // Fall back to filtering cached/CSV data
    const all = await loadProperties();
    return all;
  }

  try {
    const listings = await searchListings(params);
    if (listings.length === 0) return [];

    const properties = mapDomainListings(listings);
    if (properties.length === 0) return [];

    // Merge into file cache
    const existing = getCachedProperties();
    const existingIds = new Set(existing.map((p) => p.id));
    const newProperties = properties.filter((p) => !existingIds.has(p.id));
    if (newProperties.length > 0) {
      writeCacheProperties([...existing, ...newProperties]);
    }

    return addScores(properties);
  } catch (err) {
    console.error("Live Domain search failed:", err);
    return [];
  }
}

export async function getPropertyById(
  id: number
): Promise<ScoredProperty | undefined> {
  const all = await loadProperties();
  return all.find((p) => p.id === id);
}
