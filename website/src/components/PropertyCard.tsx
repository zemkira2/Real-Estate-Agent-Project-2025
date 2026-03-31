"use client";

import Image from "next/image";
import Link from "next/link";
import { ScoredProperty } from "@/lib/scoring";

interface PropertyCardProps {
  property: ScoredProperty;
  rank: number;
}

export default function PropertyCard({ property, rank }: PropertyCardProps) {
  const yieldPercent = (
    ((property.rent_estimate * 52) / property.price) *
    100
  ).toFixed(1);

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
          <div className="absolute inset-0 bg-gradient-to-t from-primary-950/75 via-transparent to-transparent" />

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
        <div className="p-5 flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-500 mb-1">
                Recommended
              </p>
              <h3 className="text-lg font-semibold text-primary-900 group-hover:text-primary-700 transition-colors leading-tight">
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

          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: "Beds", value: `${property.bedrooms}` },
              { label: "Land", value: `${property.land_size}m²` },
              { label: "Yield", value: `${yieldPercent}%` },
              { label: "Rent/wk", value: `$${property.rent_estimate}` },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-stone-50 rounded-lg px-2 py-2 text-center"
              >
                <p className="text-[9px] uppercase tracking-wide text-stone-400 font-medium">
                  {s.label}
                </p>
                <p className="text-sm font-semibold text-primary-900 mt-0.5">
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* Score bars */}
          <div className="space-y-2 flex-1">
            <ScoreBar
              label="Growth"
              value={property.growth_score}
              max={10}
              trackColor="bg-emerald-100"
              fillColor="bg-gradient-to-r from-emerald-400 to-emerald-500"
            />
            <ScoreBar
              label="Yield"
              value={property.yield_score}
              max={10}
              trackColor="bg-sky-100"
              fillColor="bg-gradient-to-r from-sky-400 to-blue-500"
            />
            <ScoreBar
              label="Risk"
              value={property.risk_score}
              max={10}
              trackColor="bg-rose-100"
              fillColor="bg-gradient-to-r from-rose-400 to-red-500"
            />
          </div>

          {/* Footer CTA */}
          <div className="mt-4 pt-3.5 border-t border-stone-100 flex items-center justify-between">
            <p className="text-xs text-stone-400">
              View full breakdown &amp; AI analysis
            </p>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-900 text-white text-xs font-medium rounded-lg group-hover:bg-primary-800 transition-colors">
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

function ScoreBar({
  label,
  value,
  max,
  trackColor,
  fillColor,
}: {
  label: string;
  value: number;
  max: number;
  trackColor: string;
  fillColor: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[10px] uppercase tracking-wide text-stone-400 font-medium w-10 shrink-0">
        {label}
      </span>
      <div className={`flex-1 ${trackColor} rounded-full h-1.5 overflow-hidden`}>
        <div
          className={`${fillColor} h-full rounded-full`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-stone-600 w-6 text-right shrink-0">
        {value.toFixed(0)}
      </span>
    </div>
  );
}
