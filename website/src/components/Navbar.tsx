"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const LOCAL_AUTH_USER_KEY = "rea-auth-user";

interface NavbarProps {
  userName: string;
}

export default function Navbar({ userName }: NavbarProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.localStorage.removeItem(LOCAL_AUTH_USER_KEY);
    router.push("/");
  }

  return (
    <header className="bg-primary-900 border-b border-white/8 px-6">
      <div className="max-w-7xl mx-auto h-14 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gold-400 rounded-lg flex items-center justify-center">
            <svg
              className="w-4 h-4 text-primary-950"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1"
              />
            </svg>
          </div>
          <span className="font-display text-base font-medium text-white tracking-tight">
            Estate
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <span className="text-sm text-white/50 hidden sm:block">
            Welcome,{" "}
            <span className="text-white/80 font-medium">{userName}</span>
          </span>
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
