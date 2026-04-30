"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import Logo from "@/components/Logo";
import OnboardingModal from "@/components/OnboardingModal";
import { LOCAL_AUTH_USER_KEY } from "@/lib/constants";
import { UserPreferences } from "@/lib/auth";

interface User {
  id: string;
  email: string;
  name: string;
  preferences?: UserPreferences;
}

function DashboardHub() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

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

        // Show onboarding after signup or when preferences not set
        if (searchParams.get("onboarding") === "true" || !data.user.preferences) {
          setShowOnboarding(true);
        }
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router, searchParams]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.localStorage.removeItem(LOCAL_AUTH_USER_KEY);
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-8 h-8 border-2 border-primary-900/20 border-t-primary-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-stone-50">
      {showOnboarding && (
        <OnboardingModal
          initial={user.preferences}
          onComplete={(prefs) => {
            setUser((u) => u ? { ...u, preferences: prefs } : u);
            setShowOnboarding(false);
            router.replace("/dashboard");
          }}
          onSkip={() => {
            setShowOnboarding(false);
            router.replace("/dashboard");
          }}
        />
      )}

      {/* Header */}
      <header className="bg-primary-900 border-b border-white/8 px-6">
        <div className="max-w-7xl mx-auto h-14 flex items-center justify-between">
          <Logo size="sm" variant="light" />
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/80 font-medium hidden sm:block">{user.name}</span>
            <button
              onClick={() => setShowOnboarding(true)}
              className="px-3 py-1.5 text-xs font-semibold text-white/60 hover:text-white border border-white/15 hover:border-white/30 rounded-lg transition-all"
            >
              ⚙ Preferences
            </button>
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 text-xs font-semibold text-white/60 hover:text-white border border-white/15 hover:border-white/30 rounded-lg transition-all"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
        <p className="text-gold-600 text-xs font-bold uppercase tracking-widest mb-3">Welcome back</p>
        <h1 className="font-display text-4xl font-semibold text-primary-900 mb-4">
          Hello, {user.name.split(" ")[0]}. What are you looking for today?
        </h1>
        <p className="text-stone-500 text-base">
          Choose a section below to browse personalised property recommendations.
        </p>
      </div>

      {/* Two cards */}
      <div className="max-w-3xl mx-auto px-6 pb-16 grid sm:grid-cols-2 gap-5">

        {/* Living card */}
        <Link href="/dashboard/live" className="group block">
          <div className="bg-white rounded-2xl border border-stone-200/70 shadow-card hover:shadow-card-hover transition-all p-8 text-center hover:-translate-y-0.5 duration-200">
            <div className="text-5xl mb-4">🏡</div>
            <h2 className="font-display text-xl font-semibold text-primary-900 mb-2">Find a Home</h2>
            <p className="text-stone-500 text-sm leading-relaxed mb-6">
              Discover properties ranked for comfort, safety, schools, and lifestyle — perfect for self-living.
            </p>
            <span className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-primary-950 bg-gold-400 group-hover:bg-gold-300 rounded-xl transition-all group-hover:shadow-gold">
              Browse Homes →
            </span>
          </div>
        </Link>

        {/* Investment card */}
        <Link href="/dashboard/invest" className="group block">
          <div className="bg-white rounded-2xl border border-stone-200/70 shadow-card hover:shadow-card-hover transition-all p-8 text-center hover:-translate-y-0.5 duration-200">
            <div className="text-5xl mb-4">📈</div>
            <h2 className="font-display text-xl font-semibold text-primary-900 mb-2">Investment Properties</h2>
            <p className="text-stone-500 text-sm leading-relaxed mb-6">
              Properties ranked by rental yield, capital growth, and risk score — built for investors.
            </p>
            <span className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-primary-900 group-hover:bg-primary-800 rounded-xl transition-all">
              Browse Investments →
            </span>
          </div>
        </Link>
      </div>

      {/* Preferences summary */}
      {user.preferences && (
        <div className="max-w-3xl mx-auto px-6 pb-16">
          <div className="bg-white rounded-2xl border border-stone-200/70 shadow-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-primary-900">Your Saved Preferences</h3>
              <button
                onClick={() => setShowOnboarding(true)}
                className="text-xs text-gold-600 hover:text-gold-700 font-semibold"
              >
                Edit
              </button>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 bg-stone-100 rounded-lg text-stone-600">
                Budget: ${user.preferences.budgetMin.toLocaleString()} – ${user.preferences.budgetMax.toLocaleString()}
              </span>
              {user.preferences.propertyType !== "Any" && (
                <span className="px-2.5 py-1 bg-stone-100 rounded-lg text-stone-600">{user.preferences.propertyType}</span>
              )}
              {user.preferences.minBedrooms > 0 && (
                <span className="px-2.5 py-1 bg-stone-100 rounded-lg text-stone-600">{user.preferences.minBedrooms}+ beds</span>
              )}
              {user.preferences.suburbs.length > 0 && user.preferences.suburbs.slice(0, 3).map((s) => (
                <span key={s} className="px-2.5 py-1 bg-primary-900/8 rounded-lg text-primary-900">{s}</span>
              ))}
              {user.preferences.suburbs.length > 3 && (
                <span className="px-2.5 py-1 bg-stone-100 rounded-lg text-stone-500">+{user.preferences.suburbs.length - 3} more</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardHub />
    </Suspense>
  );
}
