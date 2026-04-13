"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { LOCAL_AUTH_USER_KEY } from "@/lib/constants";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const storedUser = window.localStorage.getItem(LOCAL_AUTH_USER_KEY);
      if (!storedUser) return;
      const parsed = JSON.parse(storedUser) as { email?: string };
      if (typeof parsed.email === "string") {
        setEmail(parsed.email);
      }
    } catch {
      // Ignore malformed local data and use an empty form.
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      window.localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify(data.user));
      router.push("/dashboard");
    } catch {
      setError("Unable to connect. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-4">
      {/* Brand mark */}
      <Link href="/" className="mb-10">
        <Logo />
      </Link>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-medium text-primary-900 mb-2">
            Welcome back
          </h1>
          <p className="text-stone-500 text-sm">
            Log in to your account to continue
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-8 shadow-card border border-stone-200/60"
        >
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-primary-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-900/10 focus:border-primary-900/30 transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-primary-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-900/10 focus:border-primary-900/30 transition-all"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 px-4 py-3 text-sm font-semibold text-primary-950 bg-gold-400 hover:bg-gold-300 rounded-xl transition-all hover:shadow-gold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in…" : "Log In"}
          </button>

          <p className="text-center text-sm text-stone-400 mt-5">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-primary-700 hover:text-primary-900 font-medium"
            >
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
