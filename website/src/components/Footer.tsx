import Link from "next/link";
import Logo from "@/components/Logo";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-primary-950 text-white/70">
      <div className="max-w-7xl mx-auto px-8 py-16 grid gap-12 md:grid-cols-4">
        {/* Company */}
        <div className="md:col-span-2">
          <Logo variant="light" />
          <p className="mt-5 text-sm leading-relaxed text-white/55 max-w-sm">
            Estate is an AI-powered property intelligence platform helping
            Australians find the right home to live in or invest in across
            Victoria.
          </p>

          <div className="mt-6 space-y-2 text-sm">
            <p className="flex items-center gap-2.5">
              <svg
                className="w-4 h-4 text-gold-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Level 12, 360 Collins Street, Melbourne VIC 3000
            </p>
            <p className="flex items-center gap-2.5">
              <svg
                className="w-4 h-4 text-gold-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <a
                href="mailto:hello@estate.com.au"
                className="hover:text-gold-300 transition-colors"
              >
                hello@estate.com.au
              </a>
            </p>
            <p className="flex items-center gap-2.5">
              <svg
                className="w-4 h-4 text-gold-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M3 5a2 2 0 012-2h2.28a2 2 0 011.94 1.515l.7 2.793a2 2 0 01-.45 1.95l-1.27 1.27a11 11 0 005.272 5.272l1.27-1.27a2 2 0 011.95-.45l2.793.7A2 2 0 0121 16.72V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <a
                href="tel:+61399999999"
                className="hover:text-gold-300 transition-colors"
              >
                +61 3 9999 9999
              </a>
            </p>
          </div>
        </div>

        {/* Product */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-white mb-4">
            Product
          </h3>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link
                href="/dashboard/live"
                className="hover:text-gold-300 transition-colors"
              >
                Find a Home
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/invest"
                className="hover:text-gold-300 transition-colors"
              >
                Invest
              </Link>
            </li>
            <li>
              <Link
                href="/signup"
                className="hover:text-gold-300 transition-colors"
              >
                Sign Up
              </Link>
            </li>
            <li>
              <Link
                href="/login"
                className="hover:text-gold-300 transition-colors"
              >
                Log In
              </Link>
            </li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-white mb-4">
            Company
          </h3>
          <ul className="space-y-2.5 text-sm">
            <li>
              <a href="#" className="hover:text-gold-300 transition-colors">
                About Us
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-gold-300 transition-colors">
                Careers
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-gold-300 transition-colors">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-gold-300 transition-colors">
                Terms of Service
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/8">
        <div className="max-w-7xl mx-auto px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <p>
            &copy; {year} Estate Pty Ltd. ABN 12 345 678 901. All rights
            reserved.
          </p>
          <p className="tracking-wide">Melbourne, Victoria &middot; Australia</p>
        </div>
      </div>
    </footer>
  );
}
