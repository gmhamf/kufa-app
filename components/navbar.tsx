"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, X, Bookmark, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { clearProfile, getProfile, type BusinessProfile } from "@/lib/profile";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useTheme } from "@/components/theme-provider";

export function Navbar() {
  const pathname = usePathname();
  const { toggleTheme } = useTheme();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [mounted, setMounted] = useState(false);
  const [guest, setGuest] = useState(false);

  useEffect(() => {
    setMounted(true);
    let cancelled = false;

    const fetchProfile = async () => {
      const p = await getProfile();
      if (cancelled) return;
      setProfile(p);
      setGuest(p?.is_guest === true);
    };

    fetchProfile();

    const sb = getSupabaseBrowser();
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, _session) => {
      // Re-fetch on any auth change: SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.
      fetchProfile();
    });

    return () => { 
      cancelled = true; 
      subscription.unsubscribe();
    };
  }, []);
  const active = (p: string) => pathname === p;

  let profileBadge: React.ReactNode = null;
  if (mounted) {
    if (profile && !guest) {
      profileBadge = (
        <div className="flex items-center gap-2 rounded-lg border border-[#4285F4]/20 bg-[#4285F4]/10 px-3 py-1.5 transition-colors duration-300 dark:bg-[#4285F4]/20">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-[#4285F4] text-xs font-bold text-white">
            {(profile.company_name || "A")[0].toUpperCase()}
          </div>
          <span className="max-w-[120px] truncate text-xs font-bold text-[#4285F4] dark:text-blue-300">
            {profile.company_name}
          </span>
          <button
            type="button"
            onClick={async () => {
              await clearProfile();
              window.location.href = "/";
            }}
            className="mr-2 text-sm font-bold text-gray-400 transition hover:text-[#EA4335] dark:text-gray-500 dark:hover:text-[#EA4335]"
            title="تسجيل خروج"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      );
    } else if (guest && profile) {
      profileBadge = (
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-100 px-3 py-1.5 transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">حساب زائر</span>
          <Link
            href="/"
            className="text-xs font-bold text-[#4285F4] hover:underline dark:text-blue-400"
          >
            تسجيل شركة
          </Link>
        </div>
      );
    }
  }

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-gray-200 bg-white/90 text-gray-900 shadow-sm backdrop-blur-md transition-colors duration-500 dark:border-slate-800 dark:bg-slate-950/90 dark:text-slate-100">
      <div className="mx-auto flex py-2 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#4285F4] transition-transform group-hover:scale-110" />
            <span className="h-3 w-3 rounded-full bg-[#EA4335] transition-transform delay-75 group-hover:scale-110" />
            <span className="h-3 w-3 rounded-full bg-[#FBBC04] transition-transform delay-150 group-hover:scale-110" />
            <span className="h-3 w-3 rounded-full bg-[#34A853] transition-transform delay-200 group-hover:scale-110" />
          </div>
          <span className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">
            GDGOC Kufa B2A
          </span>
        </Link>
        <div className="flex items-center gap-5">
          <Link
            href="/"
            className={`text-sm font-semibold transition-colors duration-300 ${
              active("/")
                ? "text-[#4285F4] dark:text-blue-400"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            الرئيسية
          </Link>
          <Link
            href="/dashboard"
            className={`text-sm font-semibold transition-colors duration-300 ${
              active("/dashboard")
                ? "text-[#4285F4] dark:text-blue-400"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            لوحة المشاريع
          </Link>
          <Link
            href="/favorites"
            className={`flex items-center gap-1.5 text-sm font-semibold transition-colors duration-300 ${
              active("/favorites")
                ? "text-[#4285F4] dark:text-blue-400"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            <Bookmark className="w-4 h-4" />
            المفضلة
          </Link>
          {mounted && profile?.is_admin && (
            <Link
              href="/admin"
              className={`flex items-center gap-1.5 text-sm font-semibold transition-colors duration-300 ${
                active("/admin")
                  ? "text-[#4285F4] dark:text-blue-400"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              إدارة المنصة
            </Link>
          )}
          {profileBadge}
          <div className="h-6 w-px bg-gray-200 dark:bg-slate-700" />
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800"
            title="تغيير المظهر"
          >
            <Moon className="h-5 w-5 dark:hidden" />
            <Sun className="hidden h-5 w-5 dark:block" />
          </button>
        </div>
      </div>
    </nav>
  );
}
