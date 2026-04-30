"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { UserPreferences } from "@/lib/auth";
import { getAllSuburbKeys } from "@/lib/suburbs";

const ALL_SUBURBS = getAllSuburbKeys();

const STEPS = ["Purpose", "Budget", "Property", "Suburbs"] as const;

interface Props {
  onComplete: (prefs: UserPreferences) => void;
  onSkip: () => void;
  initial?: Partial<UserPreferences>;
}

export default function OnboardingModal({ onComplete, onSkip, initial }: Props) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Form state
  const [purpose, setPurpose] = useState<"live" | "invest" | "any">(initial?.purpose ?? "any");
  const [budgetMin, setBudgetMin] = useState(initial?.budgetMin ?? 400000);
  const [budgetMax, setBudgetMax] = useState(initial?.budgetMax ?? 1200000);
  const [propertyType, setPropertyType] = useState(initial?.propertyType ?? "Any");
  const [minBedrooms, setMinBedrooms] = useState(initial?.minBedrooms ?? 0);
  const [suburbs, setSuburbs] = useState<string[]>(initial?.suburbs ?? []);
  const [suburbSearch, setSuburbSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const suburbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (suburbRef.current && !suburbRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredSuburbs = useMemo(() => {
    const q = suburbSearch.trim().toLowerCase();
    if (q.length < 1) return [];
    return ALL_SUBURBS.filter(
      (s) => s.toLowerCase().includes(q) && !suburbs.includes(s)
    ).slice(0, 12);
  }, [suburbSearch, suburbs]);

  function addSuburb(s: string) {
    setSuburbs((prev) => (prev.includes(s) ? prev : [...prev, s]));
    setSuburbSearch("");
    setShowDropdown(false);
  }

  async function handleSave() {
    setSaving(true);
    const prefs: UserPreferences = {
      purpose, budgetMin, budgetMax, propertyType,
      minBedrooms, suburbs,
    };
    try {
      await fetch("/api/auth/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      onComplete(prefs);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-primary-900 px-7 pt-7 pb-5">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1">
            Step {step + 1} of {STEPS.length}
          </p>
          <h2 className="font-display text-2xl font-semibold text-white">
            {step === 0 && "What are you looking for?"}
            {step === 1 && "What's your budget?"}
            {step === 2 && "Tell us about the property"}
            {step === 3 && "Any preferred suburbs?"}
          </h2>
          {/* Progress bar */}
          <div className="flex gap-1.5 mt-4">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all ${
                  i <= step ? "bg-gold-400" : "bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-7 py-6">

          {/* Step 0 — Purpose */}
          {step === 0 && (
            <div className="grid grid-cols-2 gap-3">
              {(["live", "invest", "any"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPurpose(p)}
                  className={`relative flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 transition-all ${
                    p === "any" ? "col-span-2" : ""
                  } ${
                    purpose === p
                      ? "border-primary-900 bg-primary-900/5"
                      : "border-stone-200 hover:border-stone-300 bg-stone-50"
                  }`}
                >
                  <span className="text-2xl">
                    {p === "live" ? "🏡" : p === "invest" ? "📈" : "🔍"}
                  </span>
                  <span className={`text-sm font-semibold ${purpose === p ? "text-primary-900" : "text-stone-600"}`}>
                    {p === "live" ? "Find a Home to Live In" : p === "invest" ? "Find an Investment Property" : "Not sure yet — show me both"}
                  </span>
                  {purpose === p && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-primary-900 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Step 1 — Budget */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                  Minimum Budget
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">$</span>
                  <input
                    type="number" value={budgetMin} min={0} step={10000}
                    onChange={(e) => setBudgetMin(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-3 border border-stone-200 rounded-xl text-sm text-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-900/10 focus:border-primary-900/30 bg-stone-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                  Maximum Budget
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">$</span>
                  <input
                    type="number" value={budgetMax} min={0} step={10000}
                    onChange={(e) => setBudgetMax(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-3 border border-stone-200 rounded-xl text-sm text-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-900/10 focus:border-primary-900/30 bg-stone-50"
                  />
                </div>
              </div>
              <p className="text-xs text-stone-400">
                Budget range: <span className="font-medium text-stone-600">${budgetMin.toLocaleString()} – ${budgetMax.toLocaleString()}</span>
              </p>
            </div>
          )}

          {/* Step 2 — Property details */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                  Property Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["Any", "House", "Unit"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setPropertyType(t)}
                      className={`py-2.5 text-sm font-semibold rounded-xl border transition-all ${
                        propertyType === t
                          ? "bg-primary-900 text-white border-primary-900"
                          : "bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-300"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                  Min Bedrooms
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setMinBedrooms(n)}
                      className={`w-12 h-12 text-sm font-semibold rounded-xl border transition-all ${
                        minBedrooms === n
                          ? "bg-primary-900 text-white border-primary-900"
                          : "bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-300"
                      }`}
                    >
                      {n === 0 ? "Any" : `${n}+`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Suburbs */}
          {step === 3 && (
            <div>
              <div ref={suburbRef} className="relative mb-3">
                <input
                  type="text"
                  value={suburbSearch}
                  onChange={(e) => { setSuburbSearch(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && filteredSuburbs.length > 0) addSuburb(filteredSuburbs[0]);
                    if (e.key === "Escape") setShowDropdown(false);
                  }}
                  placeholder="Search any suburb…"
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-900/10 focus:border-primary-900/30 placeholder-stone-400"
                />
                {showDropdown && filteredSuburbs.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg z-10 max-h-44 overflow-y-auto">
                    {filteredSuburbs.map((s) => (
                      <button
                        key={s}
                        onMouseDown={(e) => { e.preventDefault(); addSuburb(s); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-50 first:rounded-t-xl last:rounded-b-xl"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {suburbs.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {suburbs.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 pl-3 pr-1.5 py-1.5 bg-primary-900 text-white text-xs font-medium rounded-lg">
                      {s}
                      <button
                        onClick={() => setSuburbs((prev) => prev.filter((x) => x !== s))}
                        className="w-4 h-4 flex items-center justify-center rounded hover:bg-white/20"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-400">
                  Leave empty to search all VIC suburbs.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-7 pb-7 flex items-center justify-between gap-3">
          <button
            onClick={onSkip}
            className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
          >
            {step === 0 ? "Skip for now" : "Skip all"}
          </button>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="px-4 py-2.5 text-sm font-semibold text-stone-600 border border-stone-200 rounded-xl hover:bg-stone-50 transition-all"
              >
                ← Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="px-5 py-2.5 text-sm font-semibold text-primary-950 bg-gold-400 hover:bg-gold-300 rounded-xl transition-all hover:shadow-gold"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-900 hover:bg-primary-800 rounded-xl transition-all disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Preferences"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
