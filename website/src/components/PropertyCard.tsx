"use client";

import Image from "next/image";
import Link from "next/link";
import { ScoredProperty, getSuburbAmenities } from "@/lib/scoring";

interface PropertyCardProps {
  property: ScoredProperty;
  rank: number;
}

export default function PropertyCard({ property, rank }: PropertyCardProps) {
  const yieldPercent = (
    ((property.rent_estimate * 52) / property.price) *
    100
  ).toFixed(1);

  const amenities = getSuburbAmenities(property.suburb); // hospital only; schools come from property.nearby_schools

  return (
    <Link
      href={`/dashboard/property/${property.id}`}
      aria-label={`View details for ${property.address}, ${property.suburb}`}
      className="block overflow-hidden rounded-2xl bg-white border border-stone-200/70 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5 group"
    >
      <div className="grid lg:grid-cols-[300px_1fr]">
        {/* Image */}
        <div className="relative min-h-[220px] lg:min-h-0 overflow-hidden">
          <Image
            src={property.image}
            alt={`${property.address}, ${property.suburb}`}
            fill
            sizes="(max-width: 1024px) 100vw, 300px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-950/80 via-primary-950/10 to-transparent" />

          {/* Rank badge */}
          <div className="absolute top-3 left-3 w-7 h-7 bg-gold-400 rounded-full flex items-center justify-center shadow">
            <span className="text-primary-950 text-xs font-bold">{rank}</span>
          </div>

          {/* Type badge */}
          <span className="absolute top-3 right-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-semibold text-stone-700">
            {property.property_type}
          </span>

          {/* Price overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="font-display text-2xl font-medium text-white leading-none">
              ${property.price.toLocaleString()}
            </p>
            <p className="text-white/65 text-xs mt-1">
              ${property.rent_estimate}/wk estimated rent
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="p-5 flex flex-col gap-3.5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-500 mb-0.5">
                Recommended
              </p>
              <h3 className="text-base font-semibold text-primary-900 group-hover:text-primary-700 transition-colors leading-tight truncate">
                {property.address}
              </h3>
              <p className="text-stone-400 text-sm mt-0.5">
                {property.suburb}, VIC
              </p>
            </div>
            <div className="shrink-0 text-center bg-primary-50 rounded-xl px-3.5 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-primary-400 mb-0.5">
                Score
              </p>
              <p className="font-display text-2xl font-medium text-primary-900 leading-none">
                {property.final_score.toFixed(1)}
              </p>
            </div>
          </div>

          {/* Feature pills — beds / baths / parking / land */}
          <div className="flex flex-wrap gap-2">
            <FeaturePill
              icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              label={`${property.bedrooms} Bed`}
            />
            <FeaturePill
              icon="M3 10h18M3 6h18M3 14h18M3 18h18"
              label={property.bathrooms ? `${property.bathrooms} Bath` : "—"}
            />
            <FeaturePill
              icon="M8 17l4-4 4 4m-4-5V3M3 21h18"
              label={property.parking ? `${property.parking} Park` : "No parking"}
            />
            <FeaturePill
              icon="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z"
              label={`${property.land_size}m²`}
            />
          </div>

          {/* Nearby amenities */}
          <div className="flex flex-wrap gap-2">
            <AmenityBadge
              icon="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
              label={`${property.nearby_schools} schools nearby`}
              color="text-sky-600 bg-sky-50"
            />
            {amenities.hospital && (
              <AmenityBadge
                icon="M19 11H13V5a1 1 0 00-2 0v6H5a1 1 0 000 2h6v6a1 1 0 002 0v-6h6a1 1 0 000-2z"
                label="Hospital nearby"
                color="text-rose-600 bg-rose-50"
              />
            )}
          </div>

          {/* Score bars */}
          <div className="bg-stone-50 rounded-xl px-3 py-2.5 space-y-2 flex-1">
            <ScoreBar
              label="Growth"
              value={property.growth_score}
              max={10}
              trackColor="bg-emerald-200"
              fillColor="bg-gradient-to-r from-emerald-400 to-emerald-500"
              valueColor="text-emerald-700"
            />
            <ScoreBar
              label="Yield"
              value={property.yield_score}
              max={10}
              trackColor="bg-sky-200"
              fillColor="bg-gradient-to-r from-sky-400 to-blue-500"
              valueColor="text-sky-700"
            />
            <ScoreBar
              label="Risk"
              value={property.risk_score}
              max={10}
              trackColor="bg-stone-200"
              fillColor="bg-gradient-to-r from-amber-400 to-red-500"
              valueColor={property.risk_score === 0 ? "text-emerald-600" : property.risk_score < 4 ? "text-amber-600" : "text-red-600"}
              riskLabel={property.risk_score === 0 ? "Low" : property.risk_score < 4 ? "Med" : "High"}
            />
          </div>

          {/* Footer */}
          <div className="pt-3.5 border-t border-stone-100 flex items-center justify-between">
            <p className="text-xs text-stone-400">
              {yieldPercent}% yield · Full breakdown &amp; AI analysis
            </p>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-900 text-white text-xs font-medium rounded-lg group-hover:bg-primary-800 transition-colors shrink-0">
              View details
              <svg
                className="w-3 h-3 transition-transform group-hover:translate-x-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function FeaturePill({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-50 rounded-lg text-xs font-medium text-stone-600 border border-stone-100">
      <svg className="w-3.5 h-3.5 text-stone-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={icon} />
      </svg>
      {label}
    </span>
  );
}

function AmenityBadge({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${color}`}>
      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={icon} />
      </svg>
      {label}
    </span>
  );
}

function ScoreBar({
  label,
  value,
  max,
  trackColor,
  fillColor,
  valueColor,
  riskLabel,
}: {
  label: string;
  value: number;
  max: number;
  trackColor: string;
  fillColor: string;
  valueColor: string;
  riskLabel?: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wide text-stone-500 font-semibold">
          {label}
        </span>
        <span className={`text-xs font-bold ${valueColor}`}>
          {riskLabel ?? value.toFixed(0)}
        </span>
      </div>
      <div className={`${trackColor} rounded-full h-2 overflow-hidden`}>
        <div
          className={`${fillColor} h-full rounded-full`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
