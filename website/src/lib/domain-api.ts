// Domain.com.au API client with OAuth2 token management

export interface DomainSearchParams {
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  propertyTypes?: string[];
  suburbs?: string[];
  pageSize?: number;
  pageNumber?: number;
}

export interface DomainAddressParts {
  stateAbbreviation: string;
  displayType: string;
  streetNumber: string;
  street: string;
  suburb: string;
  postcode: string;
  displayAddress: string;
}

export interface DomainMedia {
  category: string;
  url: string;
}

export interface DomainPriceDetails {
  displayPrice: string;
  price?: number;
  priceFrom?: number;
  priceTo?: number;
}

export interface DomainListing {
  id: number;
  listingType: string;
  propertyTypes: string[];
  priceDetails: DomainPriceDetails;
  media: DomainMedia[];
  addressParts: DomainAddressParts;
  bedrooms: number;
  bathrooms: number;
  carspaces: number;
  landAreaSqm?: number;
  dateUpdated: string;
  dateListed: string;
  headline: string;
  summaryDescription: string;
}

// Token cache
let accessToken: string | null = null;
let tokenExpiry: number = 0;

async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Domain API credentials not configured");
  }

  const response = await fetch("https://auth.domain.com.au/v1/connect/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: "api_listings_read api_listings_write",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Domain OAuth failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  accessToken = data.access_token;
  // Expire 60s early to avoid edge cases
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

  return accessToken!;
}

export function hasDomainCredentials(): boolean {
  return !!(process.env.CLIENT_ID && process.env.CLIENT_SECRET);
}

export async function searchListings(
  params: DomainSearchParams
): Promise<DomainListing[]> {
  const token = await getAccessToken();

  const locations: Record<string, unknown>[] = [];
  if (params.suburbs && params.suburbs.length > 0) {
    for (const suburb of params.suburbs) {
      locations.push({ state: "VIC", suburb: suburb });
    }
  } else {
    locations.push({ state: "VIC" });
  }

  const propertyTypes =
    params.propertyTypes && params.propertyTypes.length > 0
      ? params.propertyTypes
      : ["House", "ApartmentUnitFlat", "Townhouse"];

  const body = {
    listingType: "Sale",
    propertyTypes,
    locations,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    minBedrooms: params.minBedrooms,
    pageSize: params.pageSize || 100,
    pageNumber: params.pageNumber || 1,
  };

  const response = await fetch(
    "https://api.domain.com.au/v1/listings/residential/_search",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (response.status === 429) {
    console.warn("Domain API rate limit hit, returning empty results");
    return [];
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Domain API search failed (${response.status}): ${text}`);
  }

  const results = await response.json();

  // Domain returns an array of { type, listing } objects
  return results
    .filter((r: { type: string }) => r.type === "PropertyListing")
    .map((r: { listing: DomainListing }) => r.listing);
}

export async function getListingById(
  listingId: number
): Promise<DomainListing | null> {
  try {
    const token = await getAccessToken();

    const response = await fetch(
      `https://api.domain.com.au/v1/listings/${listingId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.status === 404) return null;
    if (response.status === 429) {
      console.warn("Domain API rate limit hit");
      return null;
    }
    if (!response.ok) return null;

    return await response.json();
  } catch {
    return null;
  }
}
