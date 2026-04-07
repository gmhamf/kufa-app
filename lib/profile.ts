import { getSupabaseBrowser } from "@/lib/supabase/client";

export type BusinessProfile = {
  id?: string;
  company_name: string;
  industry: string;
  business_goals: string;
  is_guest?: boolean;
  is_admin?: boolean;
};

const KEY = "b2a_profile";

/**
 * Fetches the user profile. Priority:
 * 1. Check Supabase auth session first.
 * 2. If a real session exists, fetch from business_profiles table.
 * 3. If no session, fall back to localStorage guest profile.
 * 4. If no session and no guest profile, return null.
 */
export async function getProfile(): Promise<BusinessProfile | null> {
  if (typeof window === "undefined") return null;

  const sb = getSupabaseBrowser();

  try {
    const { data: { session }, error: sessionError } = await sb.auth.getSession();

    if (sessionError) {
      console.warn("Session fetch error:", sessionError.message);
    }

    if (session?.user) {
      // Real authenticated user — always fetch fresh from DB
      const { data, error } = await sb
        .from("business_profiles")
        .select("id, company_name, industry, business_goals, is_admin")
        .eq("id", session.user.id)
        .single();

      if (data && !error) {
        // Clear any stale guest data from localStorage
        localStorage.removeItem(KEY);
        return {
          id: data.id,
          company_name: data.company_name,
          industry: data.industry,
          business_goals: data.business_goals,
          is_guest: false,
          is_admin: data.is_admin || false,
        };
      }

      // Session exists but profile fetch failed — might be a new user
      // whose profile hasn't been inserted yet, or a DB error.
      console.warn("Profile fetch failed for authenticated user:", error?.message);
      localStorage.removeItem(KEY);
      return null;
    }
  } catch (err) {
    console.warn("getProfile error:", err);
  }

  // No active session — check for guest profile in localStorage
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as BusinessProfile;
      if (p.is_guest) return p;
    }
  } catch {}

  return null;
}

export function saveGuestProfile() {
  localStorage.setItem(KEY, JSON.stringify(guestProfile()));
}

export async function clearProfile() {
  localStorage.removeItem(KEY);
  const sb = getSupabaseBrowser();
  await sb.auth.signOut();
}

export function isGuestSync(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return (JSON.parse(raw) as BusinessProfile).is_guest === true;
  } catch {}
  return false;
}

export function guestProfile(): BusinessProfile {
  return {
    company_name: "حساب زائر",
    industry: "عام",
    business_goals: "استكشاف المشاريع الأكاديمية المتاحة للتبني التجاري",
    is_guest: true,
  };
}
