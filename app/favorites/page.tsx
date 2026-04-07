"use client";

import { Inbox, Layers, Loader2, User, ArrowRight, BookmarkMinus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { getProfile, isGuestSync, type BusinessProfile } from "@/lib/profile";
import { projectDisplayTitle } from "@/lib/text";
import { Particles } from "@/components/particles";
import { motion } from "framer-motion";

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

export default function FavoritesPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [favorites, setFavorites] = useState<ProjectRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getProfile().then(p => {
      if (cancelled) return;
      if (!p) {
        router.replace("/");
      } else {
        setProfile(p);
      }
    });
    return () => { cancelled = true; };
  }, [router]);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    
    const fetchFavs = async () => {
      try {
        const sb = getSupabaseBrowser();
        let projectIds: string[] = [];

        if (isGuestSync()) {
          projectIds = JSON.parse(localStorage.getItem("b2a_favorites") || "[]");
        } else {
          const userId = profile.id || profile.company_name;
          const { data } = await sb
            .from("user_favorites")
            .select("project_id")
            .eq("user_id", userId);
            
          if (data) {
            projectIds = data.map(d => d.project_id);
          }
        }

        if (projectIds.length === 0) {
          if (!cancelled) {
            setFavorites([]);
            setLoading(false);
          }
          return;
        }

        const { data: projData, error } = await sb
          .from("projects")
          .select("*")
          .in("id", projectIds);
          
        if (!cancelled) {
          if (error) setFavorites([]);
          else setFavorites((projData as ProjectRow[]) ?? []);
        }
      } catch {
        if (!cancelled) setFavorites([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    
    fetchFavs();
    return () => { cancelled = true; };
  }, [profile]);

  const removeFavorite = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setFavorites(prev => prev ? prev.filter(p => p.id !== id) : []);
    
    if (!profile || isGuestSync()) {
      let saved = JSON.parse(localStorage.getItem("b2a_favorites") || "[]");
      saved = saved.filter((i: string) => i !== id);
      localStorage.setItem("b2a_favorites", JSON.stringify(saved));
    } else {
      const sb = getSupabaseBrowser();
      const userId = profile.id || profile.company_name;
      await sb.from("user_favorites").delete().eq("user_id", userId).eq("project_id", id);
    }
  };

  if (!profile) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-[#4285F4]" />
      </div>
    );
  }

  return (
    <main className="relative pb-10 pt-6 overflow-x-hidden min-h-screen">
      <Particles />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="animate-fade-up">
            <Link
              href="/dashboard"
              className="mb-4 inline-flex items-center gap-2 text-sm font-bold tracking-wide text-gray-500 transition-all hover:translate-x-[-4px] hover:text-[#4285F4] dark:text-gray-400 dark:hover:text-blue-400"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              العودة للوحة المشاريع
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">المشاريع المحفوظة</h1>
            <p className="mt-2 font-medium text-gray-500 transition-colors dark:text-gray-400">
              قائمة بمشاريعك الأكاديمية المفضلة الجاهزة للتبني والبحث.
            </p>
          </div>
          <div className="animate-fade-up flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-800 shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-gray-200">
            <Layers className="h-5 w-5 text-[#4285F4]" />
            المحفوظات:{" "}
            <span className="text-[#4285F4] dark:text-blue-400">
              {loading ? "…" : favorites?.length ?? 0}
            </span>
          </div>
        </div>

        {loading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 h-64">
                <div className="mb-4 h-5 w-1/3 rounded bg-gray-200 dark:bg-slate-700" />
                <div className="mb-3 h-4 w-3/4 rounded bg-gray-200 dark:bg-slate-700" />
                <div className="mb-3 h-4 w-full rounded bg-gray-200 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        )}

        {!loading && favorites && favorites.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-3xl border border-gray-100 bg-white py-24 text-center shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-300 transition-colors dark:bg-slate-800 dark:text-gray-600">
              <BookmarkMinus className="h-8 w-8" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900 transition-colors dark:text-white">لا توجد مشاريع محفوظة</h3>
            <p className="font-medium text-gray-500 dark:text-gray-400">ابدأ بتصفح المشاريع واضغط على أيقونة الحفظ لجمعها هنا.</p>
            <Link href="/dashboard" className="mt-6 inline-block rounded-lg bg-[#4285F4] px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-600">
              استكشف المشاريع
            </Link>
          </motion.div>
        )}

        {!loading && favorites && favorites.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {favorites.map((p, j) => {
              const title = projectDisplayTitle(p.titel, p.project_summary);
              const names = (p.participant_names || []).join("، ") || "غير محدد";
              const skills = (p.skills_used || []).slice(0, 3);
              const desc = p.project_summary ? `${p.project_summary.split(" ").slice(0, 15).join(" ")}...` : "استكشف التفاصيل...";
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: j * 0.05 }}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:border-[#4285F4] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500 block"
                >
                  <Link href={`/projects/${p.id}`} className="absolute inset-0 z-0" />
                  
                  <div className="relative z-10 mb-4 flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-wrap gap-1">
                      {(p.categories && p.categories.length > 0) ? (
                        p.categories.slice(0, 2).map((cat, idx) => (
                          <span key={idx} className="rounded-md bg-[#4285F4]/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#4285F4] dark:bg-[#4285F4]/20 dark:text-blue-400">
                            {cat}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-md bg-[#4285F4]/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#4285F4] dark:bg-[#4285F4]/20 dark:text-blue-400">
                          {p.scientific_department}
                        </span>
                      )}
                    </div>
                    
                    <button 
                      onClick={(e) => removeFavorite(e, p.id)}
                      className="text-gray-400 hover:text-red-500 dark:text-gray-500 transition-colors p-1 bg-white dark:bg-slate-900 rounded-full shadow-sm hover:shadow"
                      title="إزالة من المحفوظات"
                    >
                      <BookmarkMinus className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <h3 className="relative z-10 mb-2 text-xl font-extrabold leading-tight text-gray-900 transition-colors group-hover:text-[#4285F4] dark:text-white dark:group-hover:text-blue-400 pointer-events-none">
                    {title}
                  </h3>
                  <p className="relative z-10 mb-5 line-clamp-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400 pointer-events-none">{desc}</p>
                  
                  <div className="relative z-10 mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 pointer-events-none">
                    <User className="h-4 w-4" />
                    <span>إشراف: {p.supervisor_name || "—"}</span>
                  </div>
                  <div className="relative z-10 mb-6 flex flex-wrap gap-1.5 pointer-events-none">
                    {skills.map((s) => (
                      <span key={s} className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-600 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300">
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="relative z-10 mt-auto border-t border-gray-100 pt-4 dark:border-slate-800 pointer-events-none">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                      فريق العمل (المطورين)
                    </p>
                    <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-200">{names}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
