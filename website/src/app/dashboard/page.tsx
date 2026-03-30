"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import PropertyCard from "@/components/PropertyCard";
import { ScoredProperty } from "@/lib/scoring";

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
          router.push("/login");
          return;
        }
        const data = await res.json();
        setUser(data.user);
      } catch {
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={user.name} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-[320px_1fr] gap-8">
          {/* Sidebar - Search Form */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Search Criteria
              </h2>

              {/* Purpose */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purpose
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["any", "live", "invest"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPurpose(p)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        purpose === p
                          ? "bg-primary-600 text-white border-primary-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {p === "any" ? "Any" : p === "live" ? "Live" : "Invest"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Budget
                </label>
                <input
                  type="number"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(Number(e.target.value))}
                  min={0}
                  step={10000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Budget
                </label>
                <input
                  type="number"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(Number(e.target.value))}
                  min={0}
                  step={10000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>

              {/* Property Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Type
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                >
                  <option value="Any">Any</option>
                  <option value="House">House</option>
                  <option value="Unit">Unit</option>
                </select>
              </div>

              {/* Bedrooms */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Bedrooms
                </label>
                <select
                  value={minBedrooms}
                  onChange={(e) => setMinBedrooms(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
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
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Suburbs
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                  {allSuburbs.map((suburb) => (
                    <label
                      key={suburb}
                      className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSuburbs.includes(suburb)}
                        onChange={() => handleSuburbToggle(suburb)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{suburb}</span>
                    </label>
                  ))}
                </div>
                {selectedSuburbs.length > 0 && (
                  <button
                    onClick={() => setSelectedSuburbs([])}
                    className="text-xs text-primary-600 hover:text-primary-700 mt-1"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <button
                onClick={searchProperties}
                disabled={searching}
                className="w-full px-4 py-2.5 text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
              >
                {searching ? "Searching..." : "Search Properties"}
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Results header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Top Recommendations
                </h1>
                {totalMatches > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Showing top {properties.length} of {totalMatches} matching
                    properties
                    {purpose !== "any" && (
                      <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-700">
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
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
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
                  {aiLoading ? "Generating..." : "Get AI Suggestion"}
                </button>
              )}
            </div>

            {/* Search message */}
            {searchMessage && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm">
                {searchMessage}
              </div>
            )}

            {/* Property cards */}
            {properties.length > 0 && (
              <div className="grid gap-4">
                {properties.map((property, index) => (
                  <PropertyCard
                    key={`${property.address}-${property.suburb}`}
                    property={property}
                    rank={index + 1}
                  />
                ))}
              </div>
            )}

            {/* AI Suggestion */}
            {aiError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {aiError}
              </div>
            )}

            {aiLoading && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3" />
                <p className="text-gray-600">
                  AI is analysing your properties...
                </p>
              </div>
            )}

            {aiSuggestion && (
              <div className="bg-white rounded-xl border border-purple-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-purple-600"
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
                  <h2 className="text-lg font-semibold text-gray-900">
                    AI Analysis
                  </h2>
                </div>
                <div
                  className="ai-markdown text-gray-700"
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

// Simple markdown renderer (no external dependency)
function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>");
}
