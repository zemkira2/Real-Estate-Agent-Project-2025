"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ScoredProperty, getSuburbAmenities } from "@/lib/scoring";
import { renderMarkdown } from "@/lib/markdown";
import Navbar from "@/components/Navbar";
import { LOCAL_AUTH_USER_KEY } from "@/lib/constants";

interface User {
  id: string;
  email: string;
  name: string;
}

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [property, setProperty] = useState<ScoredProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // AI suggestion
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    async function fetchProperty() {
      try {
        const authRes = await fetch("/api/auth/me");
        if (!authRes.ok) {
          router.push("/login");
          return;
        }
        const authData = await authRes.json();
        setUser(authData.user);
        window.localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify(authData.user));

        const res = await fetch(`/api/properties/${params.id}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Property not found.");
          return;
        }

        setProperty(data.property);
      } catch {
        setError("Unable to load property details. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchProperty();
  }, [params.id, router]);

  async function getAiAnalysis() {
    if (!property) return;
    setAiLoading(true);
    setAiError("");
    setAiSuggestion("");

    try {
      const res = await fetch("/api/ai-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          properties: [property],
          userProfile: {
            budgetRange: [property.price - 100000, property.price + 100000],
            preferredSuburbs: [property.suburb],
            propertyType: property.property_type,
            purpose: "any",
            minBedrooms: property.bedrooms,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error || "Unable to generate analysis.");
        return;
      }
      setAiSuggestion(data.suggestion);
    } catch {
      setAiError("Unable to connect to AI service. Please try again later.");
    } finally {
      setAiLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50">
        {user && <Navbar userName={user.name} />}
        <div className="flex items-center justify-center h-[calc(100vh-56px)]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary-900/20 border-t-primary-900 rounded-full animate-spin" />
            <p className="text-stone-400 text-sm">Loading property…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-stone-50">
        {user && <Navbar userName={user.name} />}
        <div className="flex items-center justify-center h-[calc(100vh-56px)]">
          <div className="text-center">
            <p className="text-stone-500 mb-4">{error || "Property not found."}</p>
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-primary-900 hover:text-primary-700 transition-colors"
            >
              ← Back to Search
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const yieldPercent = (
    ((property.rent_estimate * 52) / property.price) *
    100
  ).toFixed(2);

  const annualRent = property.rent_estimate * 52;
  const amenities = getSuburbAmenities(property.suburb);

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar userName={user?.name ?? ""} />

      {/* Breadcrumb bar */}
      <div className="bg-white border-b border-stone-200/70 px-6">
        <div className="max-w-6xl mx-auto h-11 flex items-center gap-2 text-sm">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-stone-400 hover:text-primary-900 transition-colors font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Search Results
          </Link>
          <svg className="w-3 h-3 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-stone-500 font-medium truncate">{property.address}, {property.suburb}</span>
          <span className="ml-auto shrink-0 px-2.5 py-1 bg-stone-100 text-stone-500 text-xs font-semibold rounded-lg">
            {property.property_type}
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Hero image */}
        <div className="relative rounded-2xl overflow-hidden mb-8 h-[420px]">
          <Image
            src={property.image}
            alt={`${property.address}, ${property.suburb}`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-950/80 via-primary-950/20 to-transparent" />

          {/* Overlaid info */}
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="inline-block px-3 py-1 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full text-xs font-semibold text-white/80 mb-4">
                  {property.property_type}
                </span>
                <h1 className="font-display text-3xl lg:text-4xl font-medium text-white mb-1">
                  {property.address}
                </h1>
                <p className="text-white/60 text-base">{property.suburb}, VIC</p>
              </div>
              <div className="text-right">
                <p className="font-display text-4xl font-medium text-white">
                  ${property.price.toLocaleString()}
                </p>
                <p className="text-white/60 text-sm mt-1">
                  ${property.rent_estimate}/week estimated rent
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-7">
          {/* Left column — main info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Stats */}
            <div className="bg-white rounded-2xl border border-stone-200/70 shadow-card p-6">
              <h2 className="font-display text-lg font-medium text-primary-900 mb-5">
                Property Details
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard
                  label="Bedrooms"
                  value={`${property.bedrooms}`}
                  icon="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
                <StatCard
                  label="Bathrooms"
                  value={property.bathrooms ? `${property.bathrooms}` : "—"}
                  icon="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
                <StatCard
                  label="Parking"
                  value={property.parking ? `${property.parking}` : "None"}
                  icon="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l1 1h1m8-1H9m4 0h3m3 0h1l1-1V9a1 1 0 00-1-1h-3m-6 0V5m0 4h6"
                />
                <StatCard
                  label="Land Size"
                  value={`${property.land_size}m²`}
                  icon="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z"
                />
                <StatCard
                  label="Rental Yield"
                  value={`${yieldPercent}%`}
                  icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  highlight
                />
                <StatCard
                  label="Annual Rent"
                  value={`$${annualRent.toLocaleString()}`}
                  icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </div>

              {/* Nearby amenities */}
              <div className="mt-5 pt-5 border-t border-stone-100">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">Nearby Amenities</p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 px-3 py-2 bg-sky-50 text-sky-700 rounded-xl text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                    {property.nearby_schools} schools nearby
                  </span>
                  {amenities.hospital && (
                    <span className="inline-flex items-center gap-2 px-3 py-2 bg-rose-50 text-rose-700 rounded-xl text-sm font-medium">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H13V5a1 1 0 00-2 0v6H5a1 1 0 000 2h6v6a1 1 0 002 0v-6h6a1 1 0 000-2z" />
                      </svg>
                      Hospital nearby
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Property Description */}
            {property.description && (
              <div className="bg-white rounded-2xl border border-stone-200/70 shadow-card p-6">
                <h2 className="font-display text-lg font-medium text-primary-900 mb-4">
                  About This Property
                </h2>
                <p className="text-stone-600 text-sm leading-relaxed">
                  {property.description}
                </p>
                {property.realestate_url && (
                  <a
                    href={property.realestate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-primary-700 hover:text-primary-900 transition-colors"
                  >
                    View on realestate.com.au
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            )}

            {/* Investment Scores */}
            <div className="bg-white rounded-2xl border border-stone-200/70 shadow-card p-6">
              <h2 className="font-display text-lg font-medium text-primary-900 mb-5">
                Investment Scores
              </h2>
              <div className="space-y-5">
                <ScoreRow
                  label="Capital Growth"
                  value={property.growth_score}
                  max={10}
                  trackColor="bg-emerald-100"
                  fillColor="bg-gradient-to-r from-emerald-400 to-emerald-500"
                  textColor="text-emerald-700"
                  description="Based on land size and suburb location. City suburbs and larger lots score higher."
                />
                <ScoreRow
                  label="Rental Yield"
                  value={property.yield_score}
                  max={10}
                  trackColor="bg-sky-100"
                  fillColor="bg-gradient-to-r from-sky-400 to-blue-500"
                  textColor="text-sky-700"
                  description="Based on weekly rent relative to purchase price. Higher yield = better returns."
                />
                <ScoreRow
                  label="Risk Level"
                  value={property.risk_score}
                  max={10}
                  trackColor="bg-rose-100"
                  fillColor="bg-gradient-to-r from-rose-400 to-red-500"
                  textColor="text-rose-700"
                  description="Flood zones, bushfire risk, and industrial proximity. Lower is better."
                />
              </div>

              <div className="mt-6 pt-5 border-t border-stone-100 flex items-center justify-between">
                <span className="text-sm text-stone-500 font-medium">
                  Final Score
                </span>
                <span className="font-display text-3xl font-medium text-primary-900">
                  {property.final_score.toFixed(2)}
                </span>
              </div>
            </div>

            {/* AI Analysis */}
            <div className="bg-white rounded-2xl border border-stone-200/70 shadow-card p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-900 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-gold-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <h2 className="font-display text-lg font-medium text-primary-900">
                    AI Property Analysis
                  </h2>
                </div>
                {!aiSuggestion && !aiLoading && (
                  <button
                    onClick={getAiAnalysis}
                    className="px-4 py-2 text-xs font-semibold text-white bg-primary-900 hover:bg-primary-800 rounded-xl transition-colors flex items-center gap-2"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Analyse with AI
                  </button>
                )}
              </div>

              {aiLoading && (
                <div className="text-center py-10">
                  <div className="w-8 h-8 border-2 border-primary-900/20 border-t-primary-900 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-stone-400 text-sm">
                    AI is analysing this property…
                  </p>
                </div>
              )}

              {aiError && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                  {aiError}
                </div>
              )}

              {aiSuggestion && (
                <div
                  className="ai-markdown"
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(aiSuggestion),
                  }}
                />
              )}

              {!aiSuggestion && !aiLoading && !aiError && (
                <p className="text-stone-400 text-sm">
                  Click &quot;Analyse with AI&quot; to get a detailed
                  AI-generated report for this property.
                </p>
              )}
            </div>
          </div>

          {/* Right column — sticky summary */}
          <div>
            <div className="bg-white rounded-2xl border border-stone-200/70 shadow-card p-6 sticky top-6">
              <h3 className="font-display text-lg font-medium text-primary-900 mb-5">
                Property Summary
              </h3>

              <div className="space-y-3">
                <SummaryRow label="Address" value={property.address} />
                <SummaryRow
                  label="Suburb"
                  value={`${property.suburb}, VIC`}
                />
                <SummaryRow label="Type" value={property.property_type} />
                <SummaryRow
                  label="Price"
                  value={`$${property.price.toLocaleString()}`}
                  valueClass="font-display text-primary-900"
                />
                <SummaryRow
                  label="Weekly Rent"
                  value={`$${property.rent_estimate}/week`}
                />
                <SummaryRow
                  label="Bedrooms"
                  value={`${property.bedrooms}`}
                />
                <SummaryRow
                  label="Bathrooms"
                  value={property.bathrooms ? `${property.bathrooms}` : "—"}
                />
                <SummaryRow
                  label="Parking"
                  value={property.parking ? `${property.parking} space${property.parking > 1 ? "s" : ""}` : "None"}
                />
                <SummaryRow
                  label="Land Size"
                  value={`${property.land_size}m²`}
                />
                <SummaryRow
                  label="Rental Yield"
                  value={`${yieldPercent}%`}
                  valueClass="text-emerald-600 font-semibold"
                />
              </div>

              <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between">
                <span className="text-sm text-stone-500">Final Score</span>
                <span className="font-display text-3xl font-medium text-primary-900">
                  {property.final_score.toFixed(2)}
                </span>
              </div>

              {property.realestate_url && (
                <a
                  href={property.realestate_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold text-white bg-primary-900 hover:bg-primary-800 rounded-xl transition-all"
                >
                  View on realestate.com.au
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
              <Link
                href="/dashboard"
                className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold text-stone-500 hover:text-primary-900 border border-stone-200 hover:border-stone-300 rounded-xl transition-all"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Search Results
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 text-center ${highlight ? "bg-primary-50" : "bg-stone-50"}`}
    >
      <svg
        className={`w-5 h-5 mx-auto mb-2 ${highlight ? "text-primary-600" : "text-stone-400"}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d={icon}
        />
      </svg>
      <p className="text-xs text-stone-400 mb-1">{label}</p>
      <p
        className={`font-semibold ${highlight ? "text-primary-900" : "text-stone-800"}`}
      >
        {value}
      </p>
    </div>
  );
}

function ScoreRow({
  label,
  value,
  max,
  trackColor,
  fillColor,
  textColor,
  description,
}: {
  label: string;
  value: number;
  max: number;
  trackColor: string;
  fillColor: string;
  textColor: string;
  description: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-stone-700">{label}</span>
        <span className={`text-sm font-bold ${textColor}`}>
          {value.toFixed(1)}{" "}
          <span className="text-stone-300 font-normal">/ {max}</span>
        </span>
      </div>
      <div className={`${trackColor} rounded-full h-2 overflow-hidden mb-1.5`}>
        <div
          className={`${fillColor} h-full rounded-full`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-stone-400">{description}</p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="text-stone-400 shrink-0">{label}</span>
      <span
        className={`font-medium text-stone-800 text-right ${valueClass ?? ""}`}
      >
        {value}
      </span>
    </div>
  );
}

