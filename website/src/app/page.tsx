import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/Logo";

export default function Home() {
  return (
    <div className="bg-stone-50 min-h-screen">
      {/* Hero — full viewport, dark navy overlay on property photo */}
      <div className="relative h-screen min-h-[680px] flex flex-col">
        <Image
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80"
          alt="Premium Australian property"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary-950/85 via-primary-950/65 to-primary-950/85" />

        {/* Nav */}
        <header className="relative z-10 flex items-center justify-between px-8 lg:px-14 py-7 max-w-7xl mx-auto w-full">
          <Logo variant="light" />
          <div className="flex items-center gap-1">
            <Link
              href="/login"
              className="px-5 py-2.5 text-sm font-medium text-white/75 hover:text-white transition-colors rounded-lg"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 text-sm font-semibold text-primary-950 bg-gold-400 hover:bg-gold-300 rounded-xl transition-all hover:shadow-gold"
            >
              Sign Up
            </Link>
          </div>
        </header>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-8 -mt-8">
          <div className="text-center max-w-4xl mx-auto">
            <p className="text-gold-400 text-xs font-semibold uppercase tracking-[0.35em] mb-7">
              AI-Powered Property Intelligence
            </p>
            <h1 className="font-display text-5xl lg:text-[4.5rem] font-light text-white leading-[1.08] mb-7">
              Australia&apos;s Smartest
              <br />
              <span className="text-gold-300 font-medium italic">
                Property Agent
              </span>
            </h1>
            <p className="text-white/65 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
              Whether you&apos;re buying to live or invest, our AI analyses
              thousands of Victorian properties and surfaces the best matches
              for your needs — instantly.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/signup"
                className="px-9 py-3.5 text-base font-semibold text-primary-950 bg-gold-400 hover:bg-gold-300 rounded-xl transition-all hover:shadow-gold hover:-translate-y-0.5"
              >
                Get Started Free
              </Link>
              <Link
                href="/login"
                className="px-9 py-3.5 text-base font-medium text-white bg-white/10 hover:bg-white/18 border border-white/20 rounded-xl backdrop-blur-sm transition-all"
              >
                Log In
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="relative z-10 flex justify-center pb-8">
          <div className="flex flex-col items-center gap-2 text-white/35">
            <span className="text-[10px] font-medium tracking-[0.3em] uppercase">
              Discover
            </span>
            <svg
              className="w-4 h-4 animate-bounce"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-primary-900">
        <div className="max-w-7xl mx-auto px-8 py-5 grid grid-cols-3 divide-x divide-white/10">
          {[
            { value: "1,000+", label: "Properties Analysed" },
            { value: "25", label: "Victorian Suburbs" },
            { value: "3", label: "AI Score Factors" },
          ].map((stat) => (
            <div key={stat.label} className="text-center px-8">
              <p className="font-display text-2xl font-medium text-gold-400">
                {stat.value}
              </p>
              <p className="text-white/50 text-xs mt-1 tracking-wide">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <main className="max-w-7xl mx-auto px-8 py-24">
        <div className="text-center mb-16">
          <p className="text-gold-600 text-xs font-semibold uppercase tracking-[0.3em] mb-4">
            How It Works
          </p>
          <h2 className="font-display text-4xl font-medium text-primary-900">
            Smart Property Intelligence
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              num: "01",
              title: "Smart Search",
              desc: "Filter by price, suburb, property type, and bedrooms. Tell us if you're buying to live or invest — we optimise rankings accordingly.",
              icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
            },
            {
              num: "02",
              title: "Data-Driven Scores",
              desc: "Each property is scored on rental yield, capital growth, and risk level. Our algorithm weighs every factor to surface the best opportunities.",
              icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
            },
            {
              num: "03",
              title: "AI Analysis",
              desc: "Get a full Gemini AI analysis for any listing — pros, cons, investment reasoning, and a clear risk breakdown written in plain English.",
              icon: "M13 10V3L4 14h7v7l9-11h-7z",
            },
          ].map((f) => (
            <div
              key={f.num}
              className="bg-white rounded-2xl p-8 border border-stone-200/70 shadow-card hover:shadow-card-hover transition-shadow"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-primary-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d={f.icon}
                    />
                  </svg>
                </div>
                <span className="font-display text-5xl font-light text-stone-100 select-none">
                  {f.num}
                </span>
              </div>
              <h3 className="font-display text-xl font-medium text-primary-900 mb-3">
                {f.title}
              </h3>
              <p className="text-stone-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* CTA Banner */}
      <div className="px-8 pb-20">
        <div className="bg-primary-900 rounded-3xl px-12 py-16 text-center max-w-5xl mx-auto">
          <h2 className="font-display text-3xl lg:text-4xl font-medium text-white mb-4">
            Ready to find your perfect property?
          </h2>
          <p className="text-white/50 mb-8 max-w-lg mx-auto text-sm leading-relaxed">
            Create a free account and receive AI-powered recommendations in
            seconds — no credit card required.
          </p>
          <Link
            href="/signup"
            className="inline-block px-9 py-3.5 text-base font-semibold text-primary-950 bg-gold-400 hover:bg-gold-300 rounded-xl transition-all hover:shadow-gold"
          >
            Start for Free
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-stone-200 py-8 text-center text-stone-400 text-sm">
        Estate &mdash; AI-Powered Property Recommendations &mdash; Victoria,
        Australia
      </footer>
    </div>
  );
}
