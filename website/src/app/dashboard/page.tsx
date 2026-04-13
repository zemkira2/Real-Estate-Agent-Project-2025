"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import PropertyCard from "@/components/PropertyCard";
import { ScoredProperty } from "@/lib/scoring";
import { LOCAL_AUTH_USER_KEY } from "@/lib/constants";
import { renderMarkdown } from "@/lib/markdown";

interface User {
  id: string;
  email: string;
  name: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Search form state
  const [budgetMin, setBudgetMin] = useState(400000);
  const [budgetMax, setBudgetMax] = useState(1000000);
  const [propertyType, setPropertyType] = useState("Any");
  const [selectedSuburbs, setSelectedSuburbs] = useState<string[]>([]);
  const [minBedrooms, setMinBedrooms] = useState(0);
  const [purpose, setPurpose] = useState<"invest" | "live" | "any">("any");

  // Results state
  const [properties, setProperties] = useState<ScoredProperty[]>([]);
  const [allSuburbs, setAllSuburbs] = useState<string[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");

  // AI suggestion state
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // Check authentication
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          window.localStorage.removeItem(LOCAL_AUTH_USER_KEY);
          router.push("/login");
          return;
        }
        const data = await res.json();
        setUser(data.user);
        window.localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify(data.user));
      } catch {
        window.localStorage.removeItem(LOCAL_AUTH_USER_KEY);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  const searchProperties = useCallback(async () => {
    setSearching(true);
    setSearchMessage("");
    setAiSuggestion("");
    setAiError("");

    try {
      const params = new URLSearchParams({
        budgetMin: budgetMin.toString(),
        budgetMax: budgetMax.toString(),
        propertyType,
        minBedrooms: minBedrooms.toString(),
        purpose,
        topN: "5",
      });

      if (selectedSuburbs.length > 0) {
        params.set("suburbs", selectedSuburbs.join(","));
      }

      const res = await fetch(`/api/properties?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setSearchMessage(data.error || "Something went wrong. Please try again.");
        setProperties([]);
        return;
      }

      setProperties(data.properties);
      setTotalMatches(data.totalMatches || 0);
      setAllSuburbs(data.allSuburbs || []);
      if (data.message) setSearchMessage(data.message);
    } catch {
      setSearchMessage("Unable to load properties. Please try again.");
    } finally {
      setSearching(false);
    }
  }, [budgetMin, budgetMax, propertyType, selectedSuburbs, minBedrooms, purpose]);

  // Initial search on load
  useEffect(() => {
    if (user) searchProperties();
  }, [user, searchProperties]);

  async function getAiSuggestion() {
    if (properties.length === 0) return;

    setAiLoading(true);
    setAiError("");
    setAiSuggestion("");

    try {
      const res = await fetch("/api/ai-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          properties,
          userProfile: {
            budgetRange: [budgetMin, budgetMax],
            preferredSuburbs: selectedSuburbs,
            propertyType,
            purpose,
            minBedrooms,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAiError(data.error || "Unable to generate suggestions right now.");
        return;
      }

      setAiSuggestion(data.suggestion);
    } catch {
      setAiError("Unable to connect to AI service. Please try again later.");
    } finally {
      setAiLoading(false);
    }
  }

  function handleSuburbToggle(suburb: string) {
    setSelectedSuburbs((prev) =>
      prev.includes(suburb)
        ? prev.filter((s) => s !== suburb)
        : [...prev, suburb]
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-900/20 border-t-primary-900 rounded-full animate-spin" />
          <p className="text-stone-400 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar userName={user.name} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-[280px_1fr] gap-7">

          {/* ── Sidebar ── */}
          <div>
            <div className="bg-white rounded-2xl border border-stone-200/70 shadow-card p-6 sticky top-6">
              <h2 className="font-display text-lg font-medium text-primary-900 mb-5">
                Search Criteria
              </h2>

              {/* Purpose */}
              <div className="mb-5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-2">
                  Purpose
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["any", "live", "invest"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPurpose(p)}
                      className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                        purpose === p
                          ? "bg-primary-900 text-white border-primary-900"
                          : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
                      }`}
                    >
                      {p === "any" ? "Any" : p === "live" ? "Live" : "Invest"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div className="mb-4">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                  Min Budget
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(Number(e.target.value))}
                    min={0}
                    step={10000}
                    className="w-full pl-7 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-900/10 focus:border-primary-900/30 transition-all"
                  />
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                  Max Budget
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(Number(e.target.value))}
                    min={0}
                    step={10000}
                    className="w-full pl-7 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-900/10 focus:border-primary-900/30 transition-all"
                  />
                </div>
              </div>

              {/* Property Type */}
              <div className="mb-4">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                  Property Type
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-900/10 focus:border-primary-900/30 transition-all appearance-none cursor-pointer"
                >
                  <option value="Any">Any type</option>
                  <option value="House">House</option>
                  <option value="Unit">Unit</option>
                </select>
              </div>

              {/* Bedrooms */}
              <div className="mb-5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                  Min Bedrooms
                </label>
                <select
                  value={minBedrooms}
                  onChange={(e) => setMinBedrooms(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-900/10 focus:border-primary-900/30 transition-all appearance-none cursor-pointer"
                >
                  <option value={0}>Any</option>
                  <option value={1}>1+</option>
                  <option value={2}>2+</option>
                  <option value={3}>3+</option>
                  <option value={4}>4+</option>
                  <option value={5}>5+</option>
                </select>
              </div>

              {/* Suburbs */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                    Suburbs
                  </p>
                  {selectedSuburbs.length > 0 && (
                    <button
                      onClick={() => setSelectedSuburbs([])}
                      className="text-[10px] text-gold-600 hover:text-gold-700 font-semibold uppercase tracking-wide"
                    >
                      Clear ({selectedSuburbs.length})
                    </button>
                  )}
                </div>
                <div className="max-h-44 overflow-y-auto rounded-xl border border-stone-200 bg-stone-50 p-1.5 space-y-0.5">
                  {allSuburbs.map((suburb) => (
                    <label
                      key={suburb}
                      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                        selectedSuburbs.includes(suburb)
                          ? "bg-primary-50 text-primary-900"
                          : "hover:bg-white text-stone-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSuburbs.includes(suburb)}
                        onChange={() => handleSuburbToggle(suburb)}
                        className="rounded border-stone-300 text-primary-900 focus:ring-primary-900/20 w-3.5 h-3.5"
                      />
                      <span className="text-xs font-medium">{suburb}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={searchProperties}
                disabled={searching}
                className="w-full py-3 text-sm font-semibold text-primary-950 bg-gold-400 hover:bg-gold-300 rounded-xl transition-all hover:shadow-gold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {searching ? "Searching…" : "Search Properties"}
              </button>
            </div>
          </div>

          {/* ── Main Content ── */}
          <div className="space-y-5 min-w-0">
            {/* Results header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-medium text-primary-900">
                  Top Recommendations
                </h1>
                {totalMatches > 0 && (
                  <p className="text-stone-400 text-sm mt-1">
                    Showing top {properties.length} of{" "}
                    <span className="font-medium text-stone-600">
                      {totalMatches}
                    </span>{" "}
                    matching properties
                    {purpose !== "any" && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-gold-100 text-gold-700">
                        {purpose === "live" ? "For Living" : "For Investment"}
                      </span>
                    )}
                  </p>
                )}
              </div>

              {properties.length > 0 && (
                <button
                  onClick={getAiSuggestion}
                  disabled={aiLoading}
                  className="shrink-0 px-4 py-2 text-xs font-semibold text-white bg-primary-900 hover:bg-primary-800 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
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
                  {aiLoading ? "Generating…" : "Get AI Suggestion"}
                </button>
              )}
            </div>

            {/* Search message */}
            {searchMessage && (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-sm">
                {searchMessage}
              </div>
            )}

            {/* Searching skeleton */}
            {searching && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-48 bg-white rounded-2xl border border-stone-200/70 animate-pulse"
                  />
                ))}
              </div>
            )}

            {/* Property cards */}
            {!searching && properties.length > 0 && (
              <div className="space-y-4">
                {properties.map((property, index) => (
                  <PropertyCard
                    key={`${property.address}-${property.suburb}`}
                    property={property}
                    rank={index + 1}
                  />
                ))}
              </div>
            )}

            {/* AI Error */}
            {aiError && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                {aiError}
              </div>
            )}

            {/* AI Loading */}
            {aiLoading && (
              <div className="bg-white rounded-2xl border border-stone-200/70 shadow-card p-10 text-center">
                <div className="w-8 h-8 border-2 border-primary-900/20 border-t-primary-900 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-stone-400 text-sm">
                  AI is analysing your properties…
                </p>
              </div>
            )}

            {/* AI Suggestion */}
            {aiSuggestion && (
              <div className="bg-white rounded-2xl border border-stone-200/70 shadow-card p-7">
                <div className="flex items-center gap-3 mb-5">
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
                    AI Analysis
                  </h2>
                </div>
                <div
                  className="ai-markdown"
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(aiSuggestion),
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
