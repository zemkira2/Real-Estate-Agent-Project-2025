// Maps Domain API listings to the app's Property interface

import { DomainListing } from "./domain-api";
import { Property, getPropertyImage } from "./scoring";

const CITY_SUBURBS = [
  "Richmond", "Fitzroy", "St Kilda", "Carlton", "Brunswick",
  "Frankston", "Werribee", "Dandenong", "Sunshine", "Box Hill",
  "Essendon", "Preston", "Reservoir", "South Yarra", "Toorak",
  "Hawthorn", "Footscray",
];

// Rent estimate ranges by bedroom count (weekly)
const RENT_RANGES: Record<number, [number, number]> = {
  1: [250, 450],
  2: [350, 600],
  3: [400, 750],
  4: [500, 1000],
  5: [600, 1200],
};

function parsePrice(listing: DomainListing): number | null {
  // Use numeric price fields first
  if (listing.priceDetails?.price && listing.priceDetails.price > 0) {
    return listing.priceDetails.price;
  }
  if (listing.priceDetails?.priceFrom && listing.priceDetails.priceFrom > 0) {
    if (listing.priceDetails.priceTo && listing.priceDetails.priceTo > 0) {
      return Math.round(
        (listing.priceDetails.priceFrom + listing.priceDetails.priceTo) / 2
      );
    }
    return listing.priceDetails.priceFrom;
  }

  // Parse from display string
  const display = listing.priceDetails?.displayPrice || "";
  if (!display || /contact\s*agent/i.test(display) || /auction/i.test(display)) {
    return null;
  }

  // Match dollar amounts like $500,000 or $500K or $1.2M
  const amounts: number[] = [];
  const regex = /\$\s*([\d,.]+)\s*(k|m)?/gi;
  let match;
  while ((match = regex.exec(display)) !== null) {
    let value = parseFloat(match[1].replace(/,/g, ""));
    if (match[2]?.toLowerCase() === "k") value *= 1000;
    if (match[2]?.toLowerCase() === "m") value *= 1000000;
    if (value > 10000) amounts.push(value);
  }

  if (amounts.length === 0) return null;
  if (amounts.length >= 2) {
    return Math.round((amounts[0] + amounts[1]) / 2);
  }
  return Math.round(amounts[0]);
}

function estimateRent(price: number, bedrooms: number): number {
  // Base estimate: 4% gross yield
  let estimate = (price * 0.04) / 52;

  // Clamp to bedroom-based range
  const range = RENT_RANGES[Math.min(bedrooms, 5)] || RENT_RANGES[3];
  estimate = Math.max(range[0], Math.min(range[1], estimate));

  return Math.round(estimate);
}

function estimateLandSize(
  propertyType: string,
  suburb: string
): number {
  if (propertyType === "Unit") return 0;
  if (CITY_SUBURBS.includes(suburb)) return 350;
  return 600;
}

function mapPropertyType(domainTypes: string[]): string {
  if (!domainTypes || domainTypes.length === 0) return "House";
  const type = domainTypes[0];
  if (type === "House" || type === "Townhouse" || type === "Villa") return "House";
  if (type === "ApartmentUnitFlat" || type === "Studio") return "Unit";
  return "House";
}

function getImage(listing: DomainListing, index: number, propertyType: string): string {
  if (listing.media && listing.media.length > 0) {
    const photo = listing.media.find((m) => m.category === "Image" || m.category === "Photo");
    if (photo?.url) return photo.url;
    // Fall back to first media item
    if (listing.media[0]?.url) return listing.media[0].url;
  }
  return getPropertyImage(index, propertyType);
}

export function mapDomainToProperty(
  listing: DomainListing,
  index: number
): Property | null {
  const price = parsePrice(listing);
  if (!price) return null;

  const propertyType = mapPropertyType(listing.propertyTypes);
  const bedrooms = listing.bedrooms || 2;
  const suburb = listing.addressParts?.suburb || "Unknown";
  const landSize = listing.landAreaSqm || estimateLandSize(propertyType, suburb);

  const address =
    listing.addressParts?.displayAddress ||
    [listing.addressParts?.streetNumber, listing.addressParts?.street]
      .filter(Boolean)
      .join(" ") ||
    "Address unavailable";

  return {
    id: listing.id || index,
    price,
    rent_estimate: estimateRent(price, bedrooms),
    property_type: propertyType,
    address,
    suburb,
    land_size: landSize,
    bedrooms,
    image: getImage(listing, index, propertyType),
  };
}

export function mapDomainListings(listings: DomainListing[]): Property[] {
  return listings
    .map((listing, index) => mapDomainToProperty(listing, index))
    .filter((p): p is Property => p !== null);
}
