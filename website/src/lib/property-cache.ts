// JSON file-based cache for Domain API property data

import fs from "fs";
import path from "path";
import { Property } from "./scoring";

interface CacheData {
  lastUpdated: string;
  listings: Property[];
}

const CACHE_PATH = path.join(process.cwd(), "data", "domain-cache.json");

function getCacheTtlMinutes(): number {
  const envTtl = process.env.DOMAIN_CACHE_TTL_MINUTES;
  if (envTtl) {
    const parsed = parseInt(envTtl, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 360; // 6 hours default
}

function ensureCacheDir(): void {
  const dir = path.dirname(CACHE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getCachedProperties(): Property[] {
  try {
    if (!fs.existsSync(CACHE_PATH)) return [];
    const raw = fs.readFileSync(CACHE_PATH, "utf-8");
    const data: CacheData = JSON.parse(raw);
    return data.listings || [];
  } catch {
    return [];
  }
}

export function writeCacheProperties(properties: Property[]): void {
  try {
    ensureCacheDir();
    const data: CacheData = {
      lastUpdated: new Date().toISOString(),
      listings: properties,
    };
    fs.writeFileSync(CACHE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write property cache:", err);
  }
}

export function isCacheStale(): boolean {
  try {
    if (!fs.existsSync(CACHE_PATH)) return true;
    const raw = fs.readFileSync(CACHE_PATH, "utf-8");
    const data: CacheData = JSON.parse(raw);
    if (!data.lastUpdated) return true;

    const age = Date.now() - new Date(data.lastUpdated).getTime();
    const maxAge = getCacheTtlMinutes() * 60 * 1000;
    return age > maxAge;
  } catch {
    return true;
  }
}

export function getCacheAge(): number | null {
  try {
    if (!fs.existsSync(CACHE_PATH)) return null;
    const raw = fs.readFileSync(CACHE_PATH, "utf-8");
    const data: CacheData = JSON.parse(raw);
    if (!data.lastUpdated) return null;
    return Math.round((Date.now() - new Date(data.lastUpdated).getTime()) / 60000);
  } catch {
    return null;
  }
}
