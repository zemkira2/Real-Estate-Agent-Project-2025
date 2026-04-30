"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import { LOCAL_AUTH_USER_KEY } from "@/lib/constants";

interface NavbarProps {
  userName: string;
  mode?: "live" | "invest";
  onEditPreferences?: () => void;
}

export default function Navbar({ userName, onEditPreferences }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.localStorage.removeItem(LOCAL_AUTH_USER_KEY);
    router.push("/");
  }

  const tabs = [
    { label: "🏡 Find a Home", href: "/dashboard/live" },
    { label: "📈 Invest", href: "/dashboard/invest" },
  ];

  return (
    <header className="bg-primary-900 border-b border-white/8 px-6">
      <div className="max-w-7xl mx-auto h-14 flex items-center justify-between gap-4">
        <Link href="/dashboard">
          <Logo size="sm" variant="light" />
        </Link>

        {/* Nav tabs */}
        <nav className="flex items-center gap-1">
          {tabs.map((tab) => {
            const active = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/50 hover:text-white hover:bg-white/8"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <span className="text-sm text-white/50 hidden sm:block">
            <span className="text-white/80 font-medium">{userName}</span>
          </span>
          {onEditPreferences && (
            <button
              onClick={onEditPreferences}
              className="px-3 py-1.5 text-xs font-semibold text-white/60 hover:text-white border border-white/15 hover:border-white/30 rounded-lg transition-all"
              title="Edit preferences"
            >
              ⚙ Preferences
            </button>
          )}
          <button
            onClick={handleLogout}
            className="px-3.5 py-1.5 text-xs font-semibold text-white/60 hover:text-white border border-white/15 hover:border-white/30 rounded-lg transition-all"
          >
            Log Out
          </button>
        </div>
      </div>
    </header>
  );
}
