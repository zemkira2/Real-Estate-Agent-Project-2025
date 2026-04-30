"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { LOCAL_AUTH_USER_KEY } from "@/lib/constants";

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
        <Link href="/dashboard">
          <Logo size="sm" variant="light" />
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
