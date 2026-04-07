"use client";

import { Inbox, Info, Layers, Loader2, User, Search, Filter, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useMemo } from "react";
import Fuse from "fuse.js";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { getProfile, type BusinessProfile } from "@/lib/profile";
import { projectDisplayTitle } from "@/lib/text";
import { Particles } from "@/components/particles";

type ProjectRow = {
  id: string;
  scientific_department: string;
  categories?: string[];
  project_summary: string | null;
  titel?: string | null;
  supervisor_name: string | null;
  participant_names: string[] | null;
  skills_used: string[] | null;
};

// Typing animation header
function TypingHeader() {
  const phrases = [
    "جسرك المباشر بين الأكاديمية وسوق العمل",
    "عقول شابة تبتكر حلولاً لتحديات أعمالك",
    "مشاريع اكاديمية جاهزة للتحول إلى منتجات تجارية",
    "تقييم استراتيجي للمشاريع مدعوم بالذكاء الاصطناعي",
    "اكتشف وادعم الجيل القادم من المواهب التقنية"
  ];
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(150);

  useEffect(() => {
    if (subIndex === phrases[index].length + 1 && !reverse) {
      setReverse(true);
      setTypingSpeed(50);
      return;
    }
    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % phrases.length);
      setTypingSpeed(150);
      return;
    }
    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, typingSpeed);
    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse, typingSpeed, phrases]);

  return (
    <div className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white min-h-[4rem]">
      {phrases[index].substring(0, subIndex)}
      <span className="typing-cursor" />
    </div>
  );
}

export function DashboardClient() {
  const router = useRouter();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [projects, setProjects] = useState<ProjectRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [guest, setGuest] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchProfile = async () => {
      const p = await getProfile();
      if (cancelled) return;
      if (!p) {
        router.replace("/");
      } else {
        setProfile(p);
        setGuest(p.is_guest === true);
      }
    };

    fetchProfile();

    const sb = getSupabaseBrowser();
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, _session) => {
      fetchProfile();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    (async () => {
      try {
        const sb = getSupabaseBrowser();
        const { data, error } = await sb.from("projects").select("*").order("created_at", { ascending: false });
        if (!cancelled) {
          if (error) setProjects([]);
          else setProjects((data as ProjectRow[]) ?? []);
        }
      } catch {
        if (!cancelled) setProjects([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile]);

  // Derived Categories
  const categories = useMemo(() => {
    if (!projects) return ["الكل"];
    const uniqueCategories = new Set<string>();
    projects.forEach((p) => {
      if (p.categories && Array.isArray(p.categories) && p.categories.length > 0) {
        p.categories.forEach(c => uniqueCategories.add(c));
      } else if (p.scientific_department) {
        uniqueCategories.add(p.scientific_department);
      }
    });
    return ["الكل", ...Array.from(uniqueCategories)];
  }, [projects]);

  // Handle Search Change with typing effect
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsSearching(true);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setIsSearching(false);
    }, 400); // Wait 400ms before stopping the spinner
  };

  // Filter Projects logic
  const filteredProjects = useMemo(() => {
    if (!projects) return [];

    let result = projects;

    // 1. Filter by Category
    if (selectedCategory !== "الكل") {
      result = result.filter((p) => {
        if (p.categories && Array.isArray(p.categories) && p.categories.length > 0) {
          return p.categories.includes(selectedCategory);
        }
        return p.scientific_department === selectedCategory;
      });
    }

    // 2. Filter by Search Query
    if (searchQuery.trim() !== "") {
      const fuse = new Fuse(result, {
        keys: ["titel", "project_summary", "categories"],
        threshold: 0.3, // tolerance for typos (lower = exact, higher = fuzzy)
        distance: 100,
        ignoreLocation: true,
      });
      const searchResults = fuse.search(searchQuery);
      result = searchResults.map((res) => res.item);
    }

    return result;
  }, [projects, selectedCategory, searchQuery]);

  if (!profile) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-[#4285F4]" />
      </div>
    );
  }



  return (
    <main className="relative pb-10 pt-6 overflow-x-hidden">
      <Particles />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="animate-fade-up">
            <TypingHeader />
            <p className="font-medium text-gray-500 transition-colors dark:text-gray-400">
              استكشف كافة المشاريع المتاحة وتحقق من نسبة التوافق الفني والاستراتيجي مع مؤسستك.
            </p>
          </div>
          <div className="animate-fade-up flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-800 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-gray-200">
            <Layers className="h-5 w-5 text-[#4285F4]" />
            المشاريع المؤرشفة:{" "}
            <span className="text-[#4285F4] dark:text-blue-400">
              {loading ? "…" : projects?.length ?? 0}
            </span>
          </div>
        </div>

        {guest && (
          <div className="animate-fade-up mb-8 flex flex-wrap items-center gap-5 rounded-2xl border border-gray-800 bg-gray-900 p-5 text-white transition-all hover:shadow-xl dark:border-slate-700 dark:bg-slate-800/80">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-800 text-gray-300 transition-colors dark:bg-slate-700 dark:text-gray-400">
              <Info className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold">وضع القراءة المفتوح</p>
              <p className="mt-1 text-sm text-gray-400">
                اضغط على أي مشروع لتقييم الابتكار العام. للحصول على تقييم احترافي وتحليل مطابقة شامل، نوصي بتسجيل حساب
                مؤسسي.
              </p>
            </div>
            <Link
              href="/"
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-center text-sm font-bold text-gray-900 shadow-sm transition-all hover:scale-[1.02] hover:bg-gray-100 active:scale-98"
            >
              إنشاء ملف الشركة
            </Link>
          </div>
        )}

        {!guest && profile && (
          <div className="animate-fade-up mb-8 flex flex-wrap items-center gap-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#4285F4] to-[#34A853] text-xl font-extrabold text-white shadow-inner animate-soft-shine">
              {(profile.company_name || "C")[0].toUpperCase()}
            </div>
            <div className="min-w-[200px] flex-1">
              <h3 className="text-xl font-extrabold tracking-tight text-gray-900 transition-colors dark:text-white">
                {profile.company_name}
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-md border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gray-700 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300">
                  {profile.industry}
                </span>
                <span className="hidden text-sm font-medium text-gray-500 dark:text-gray-400 sm:inline-block">
                  ( {profile.business_goals.length > 50 ? `${profile.business_goals.slice(0, 50)}...` : profile.business_goals} )
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Premium Smart Search & Filtering Bar */}
        {!loading && projects && projects.length > 0 && (
          <div className="animate-fade-up mb-8 rounded-2xl border border-gray-200/60 bg-white/60 p-4 shadow-lg backdrop-blur-md transition-all dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-900/20">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              
              {/* Search Input */}
              <div className="relative w-full md:max-w-md">
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                  {isSearching ? (
                    <Loader2 className="h-5 w-5 animate-spin text-[#4285F4]" />
                  ) : (
                    <Search className="h-5 w-5 text-gray-400 transition-colors group-focus-within:text-[#4285F4] dark:text-gray-500" />
                  )}
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="ابحث عن مشروع (عنوان، ملخص)..."
                  className="block w-full rounded-xl border-0 bg-white/80 py-3.5 pl-10 pr-12 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 transition-all focus:ring-2 focus:ring-inset focus:ring-[#4285F4] dark:bg-slate-800/80 dark:text-white dark:ring-slate-700 dark:focus:ring-blue-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setIsSearching(false);
                    }}
                    className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Category Pills (Horizontal Scrollable) */}
              <div className="flex w-full items-center gap-2 overflow-x-auto pb-2 pt-1 md:w-auto md:pb-0 md:pt-0 scrollbar-hide">
                <div className="flex items-center gap-1.5 px-2 text-gray-400 dark:text-gray-500 shrink-0">
                  <Filter className="h-4 w-4" />
                </div>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`shrink-0 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300 ${
                      selectedCategory === cat
                        ? "bg-[#4285F4] text-white shadow-md shadow-[#4285F4]/30 scale-100"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-[1.02] active:scale-95 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700 dark:hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="mb-4 h-5 w-1/3 rounded bg-gray-200 dark:bg-slate-700" />
                <div className="mb-3 h-4 w-3/4 rounded bg-gray-200 dark:bg-slate-700" />
                <div className="mb-3 h-4 w-full rounded bg-gray-200 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        )}

        {!loading && projects && projects.length === 0 && (
          <div className="animate-fade-up mt-8 rounded-3xl border border-gray-100 bg-white py-24 text-center shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-300 transition-colors dark:bg-slate-800 dark:text-gray-600">
              <Inbox className="h-8 w-8" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900 transition-colors dark:text-white">قاعدة البيانات فارغة</h3>
            <p className="font-medium text-gray-500 dark:text-gray-400">لم يتم العثور على أي مشاريع حتى الآن.</p>
          </div>
        )}

        {!loading && projects && projects.length > 0 && (
          <>
            {filteredProjects.length === 0 ? (
              <div className="animate-fade-up mt-4 rounded-3xl border border-gray-100 bg-white py-20 text-center shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-300 transition-colors dark:bg-slate-800 dark:text-gray-600">
                  <Search className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-900 transition-colors dark:text-white">لم يتم العثور على نتائج</h3>
                <p className="font-medium text-gray-500 dark:text-gray-400">جرب البحث بكلمات مختلفة أو قم بإلغاء الفلتر الحالي.</p>
                <button 
                  onClick={() => { setSearchQuery(""); setSelectedCategory("الكل"); setIsSearching(false); }}
                  className="mt-6 rounded-lg bg-[#4285F4] px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                >
                  إعادة ضبط البحث
                </button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredProjects.map((p, j) => {
                  const title = projectDisplayTitle(p.titel, p.project_summary);
              const names = (p.participant_names || []).join("، ") || "غير محدد";
              const skills = (p.skills_used || []).slice(0, 3);
              const desc = p.project_summary
                ? `${p.project_summary.split(" ").slice(0, 15).join(" ")}...`
                : "استكشف تفاصيل هذا المشروع الأكاديمي المميز.";
              return (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:border-[#4285F4] active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500 animate-fade-up"
                  style={{ animationDelay: `${j * 50}ms` }}
                  onMouseMove={(e) => {
                    const card = e.currentTarget;
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    const rotateX = (y - centerY) / 20;
                    const rotateY = (centerX - x) / 20;
                    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "";
                  }}
                >
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-wrap gap-1">
                      {(p.categories && Array.isArray(p.categories) && p.categories.length > 0) ? (
                        p.categories.slice(0, 2).map((cat, idx) => (
                          <span key={idx} className="rounded-md bg-[#4285F4]/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#4285F4] transition-colors dark:bg-[#4285F4]/20 dark:text-blue-400">
                            {cat}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-md bg-[#4285F4]/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#4285F4] transition-colors dark:bg-[#4285F4]/20 dark:text-blue-400">
                          {p.scientific_department}
                        </span>
                      )}
                    </div>
                    <span className="text-gray-300 transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:text-[#4285F4] dark:text-gray-600 dark:group-hover:text-blue-400">
                      ↖
                    </span>
                  </div>
                  <h3 className="mb-2 text-xl font-extrabold leading-tight text-gray-900 transition-colors group-hover:text-[#4285F4] dark:text-white dark:group-hover:text-blue-400">
                    {title}
                  </h3>
                  <p className="mb-5 line-clamp-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{desc}</p>
                  <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                    <User className="h-4 w-4" />
                    <span>إشراف: {p.supervisor_name || "—"}</span>
                  </div>
                  <div className="mb-6 flex flex-wrap gap-1.5">
                    {skills.map((s) => (
                      <span
                        key={s}
                        className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-600 transition-all hover:scale-105 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto border-t border-gray-100 pt-4 dark:border-slate-800">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                      فريق العمل (المطورين)
                    </p>
                    <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-200">{names}</p>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 origin-left scale-x-0 bg-gradient-to-l from-[#4285F4] to-[#34A853] transition-transform group-hover:scale-x-100" />
                </Link>
              );
            })}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}