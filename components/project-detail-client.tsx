"use client";

import { ArrowRight, BrainCircuit, Loader2, MailPlus, SearchX, User, Star, Bookmark, Trash2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { analyzeProject } from "@/lib/api";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { getProfile, isGuestSync, type BusinessProfile } from "@/lib/profile";
import { projectDisplayTitle } from "@/lib/text";
import { Particles } from "@/components/particles";

type ProjectRow = {
  id: string;
  scientific_department: string;
  categories?: string[];
  project_summary: string | null;
  titel?: string | null;
  supervisor_name: string | null;
  academic_stage: string | null;
  readiness_status: string | null;
  participant_names: string[] | null;
  participant_emails: string[] | null;
  skills_used: string[] | null;
};

type ProjectFeedbackRow = {
  id: string; // uuid
  project_id: number | string;
  rating: number;
  comment: string | null;
  created_at: string;
};

function ScoreCircle({ score, label }: { score: number; label: string }) {
  const colorAttr = score >= 70 ? "#34A853" : score >= 40 ? "#FBBC04" : "#EA4335";
  const colorCls =
    score >= 70 ? "text-[#34A853]" : score >= 40 ? "text-[#FBBC04]" : "text-[#EA4335]";
  const r = 60;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-32 w-32 items-center justify-center rounded-full border border-gray-700 bg-gray-800 shadow-inner dark:bg-slate-900 dark:border-slate-800 animate-gentle-pulse">
        <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90 text-gray-700 dark:text-slate-800">
          <circle cx="64" cy="64" r={r} fill="none" stroke="currentColor" strokeWidth="6" />
          <circle
            cx="64"
            cy="64"
            r={r}
            fill="none"
            stroke={colorAttr}
            strokeWidth="6"
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-extrabold tracking-tighter ${colorCls}`}>
            {score}
            <span className="ml-1 text-sm opacity-70">%</span>
          </span>
        </div>
      </div>
      <span className="mt-4 text-center text-[11px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-500">
        {label}
      </span>
    </div>
  );
}

export function ProjectDetailClient() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aiScore, setAiScore] = useState<number | null>(null);
  const [aiLabel, setAiLabel] = useState("جاري التحليل...");
  const [analysisHtml, setAnalysisHtml] = useState<string | null>(null);
  const [analysisSubtitle, setAnalysisSubtitle] = useState("تحليل مخصص عبر ذكاء اصطناعي GDGOC");

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [feedbacks, setFeedbacks] = useState<ProjectFeedbackRow[]>([]);
  const [feedbacksLoading, setFeedbacksLoading] = useState(true);

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [relatedProjects, setRelatedProjects] = useState<ProjectRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    getProfile().then((p) => {
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
    if (!profile || !id) return;
    let cancelled = false;
    (async () => {
      try {
        const sb = getSupabaseBrowser();
        const { data, error: qErr } = await sb.from("projects").select("*").eq("id", id).single();
        if (cancelled) return;
        if (qErr || !data) {
          setError(true);
          setLoading(false);
          return;
        }
        const proj = data as ProjectRow;
        setProject(proj);

        const guest = isGuestSync();
        if (guest) {
          setAnalysisSubtitle("تقييم الابتكار الاستثماري (حساب ضيف)");
          setAiLabel("معيار الجودة الشامل");
        } else {
          setAnalysisSubtitle(`نسبة التوافق الاستراتيجي لـ: ${profile.company_name}`);
          setAiLabel("مؤشر التوافق القياسي");
        }

        const ai = await analyzeProject(profile, proj, "deep_analysis");
        if (cancelled) return;
        const score = Number(ai.score) || 0;
        setAiScore(score);

        if (guest) {
          const body =
            ai.analysis ||
            ai.reason ||
            "المشروع قيد المراجعة الابتكارية...";
          setAnalysisHtml(
            `<p class="mb-5">${escapeHtml(body)}</p>` +
            `<div class="p-4 bg-gray-700/50 border border-gray-600 rounded-xl flex items-start gap-4">` +
            `<div class="w-8 h-8 rounded-full bg-[#FBBC04]/20 flex items-center justify-center text-[#FBBC04] shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg></div>` +
            `<p class="text-xs font-bold text-gray-300 leading-relaxed">للحصول على نسبة توافق دائرية دقيقة وتحليل استراتيجي مفصل لما يمكن أن تقدمه هذه التقنية لشركتك، يرجى <a href="/" class="text-white underline decoration-gray-500 underline-offset-4 hover:text-[#4285F4] transition">إنشاء ملف مؤسسي لكافة الميزات</a>.</p>` +
            `</div>`
          );
        } else {
          const text = ai.analysis || ai.reason || "تعذر جلب التحليل التوافقي التلقائي.";
          setAnalysisHtml(`<p class="whitespace-pre-line leading-loose">${escapeHtml(text)}</p>`);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, id]);

  useEffect(() => {
    if (!id) return;
    setHasVoted(!!Cookies.get(`voted_project_${id}`));

    let cancelled = false;
    (async () => {
      try {
        const sb = getSupabaseBrowser();
        const { data, error } = await sb
          .from("project_feedback")
          .select("*")
          .eq("project_id", id)
          .order("created_at", { ascending: false });
        if (!cancelled && !error) {
          setFeedbacks((data as ProjectFeedbackRow[]) || []);
        }
      } catch {
        // silently fail or log
      } finally {
        if (!cancelled) setFeedbacksLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Check Bookmark status
  useEffect(() => {
    if (!id) return;
    const checkBookmark = async () => {
      if (!profile || isGuestSync()) {
        const saved = JSON.parse(localStorage.getItem("b2a_favorites") || "[]");
        setIsBookmarked(saved.includes(id));
      } else {
        const sb = getSupabaseBrowser();
        const userId = profile.id || profile.company_name;
        const { data } = await sb
          .from("user_favorites")
          .select("id")
          .eq("user_id", userId)
          .eq("project_id", id)
          .single();
        setIsBookmarked(!!data);
      }
    };
    checkBookmark();
  }, [profile, id]);

  // Load Related Projects
  useEffect(() => {
    if (!project) return;
    let cancelled = false;
    (async () => {
      const sb = getSupabaseBrowser();
      const { data, error } = await sb.from("projects").select("*").neq("id", project.id).limit(40);
      if (!cancelled && !error && data) {
        const all = data as ProjectRow[];
        const projCats = project.categories || [];
        const rel = all.filter(p => {
          if (p.categories && projCats.length > 0) {
            return p.categories.some(c => projCats.includes(c));
          }
          return p.scientific_department === project.scientific_department;
        });
        const shuffled = rel.sort(() => 0.5 - Math.random());
        setRelatedProjects(shuffled.slice(0, 3));
      }
    })();
    return () => { cancelled = true; };
  }, [project]);

  const toggleBookmark = async () => {
    if (bookmarkLoading) return;
    setBookmarkLoading(true);
    try {
      if (!profile || isGuestSync()) {
        let saved = JSON.parse(localStorage.getItem("b2a_favorites") || "[]");
        if (isBookmarked) {
          saved = saved.filter((i: string) => i !== id);
        } else {
          saved.push(id);
        }
        localStorage.setItem("b2a_favorites", JSON.stringify(saved));
        setIsBookmarked(!isBookmarked);
      } else {
        const sb = getSupabaseBrowser();
        const userId = profile.id || profile.company_name;
        if (isBookmarked) {
          await sb.from("user_favorites").delete().eq("user_id", userId).eq("project_id", id);
        } else {
          await sb.from("user_favorites").insert({ user_id: userId, project_id: id });
        }
        setIsBookmarked(!isBookmarked);
      }
    } catch {
      // fail silently
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleDeleteFeedback = async (fbId: string) => {
    if (!profile?.is_admin || !confirm("هل أنت متأكد من حذف هذه المراجعة؟")) return;
    const sb = getSupabaseBrowser();
    const { error } = await sb.from("project_feedback").delete().eq("id", fbId);
    if (!error) {
      setFeedbacks((prev) => prev.filter(f => f.id !== fbId));
    }
  };

  const handleSubmitFeedback = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);
    try {
      const sb = getSupabaseBrowser();
      const { data, error } = await sb.from("project_feedback").insert({
        project_id: id,
        rating,
        comment: comment.trim() || null,
      }).select().single();

      if (!error) {
        Cookies.set(`voted_project_${id}`, "true", { expires: 365 });
        setHasVoted(true);
        if (data) {
          setFeedbacks((prev) => [data as ProjectFeedbackRow, ...prev]);
        } else {
          setFeedbacks((prev) => [
            {
              id: Math.random().toString(),
              project_id: id,
              created_at: new Date().toISOString(),
              rating,
              comment: comment.trim() || null,
            },
            ...prev,
          ]);
        }
      }
    } catch {
      // fail
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error || (!loading && !project)) {
    return (
      <main className="flex flex-1 flex-col pb-16 pt-8">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="animate-fade-up mt-8 rounded-3xl border border-gray-200 bg-white py-24 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400">
              <SearchX className="h-8 w-8" />
            </div>
            <h3 className="mb-2 text-xl font-extrabold text-gray-900 dark:text-white">سجل غير متوفر</h3>
            <p className="mb-8 font-medium text-gray-500 dark:text-gray-400">تعذر العثور على المشروع التعريفي في القاعدة الأكاديمية.</p>
            <Link
              href="/dashboard"
              className="inline-block rounded-xl bg-[#4285F4] px-8 py-3 font-bold tracking-wide text-white shadow-md transition-all hover:scale-[1.02] hover:bg-blue-600 active:scale-98"
            >
              عودة للقائمة الكاملة
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!profile || loading || !project) {
    return (
      <main className="relative flex flex-1 flex-col items-center justify-center py-24 min-h-[60vh]">
        <div className="flex flex-col items-center gap-6">
          {/* مجموعة النقاط المتتابعة */}
          <div className="flex gap-3">
            <span className="h-3 w-3 rounded-full bg-[#4285F4] animate-bounce-dot" style={{ animationDelay: "0s" }} />
            <span className="h-3 w-3 rounded-full bg-[#EA4335] animate-bounce-dot" style={{ animationDelay: "0.2s" }} />
            <span className="h-3 w-3 rounded-full bg-[#FBBC04] animate-bounce-dot" style={{ animationDelay: "0.4s" }} />
            <span className="h-3 w-3 rounded-full bg-[#34A853] animate-bounce-dot" style={{ animationDelay: "0.6s" }} />
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse">
            جاري تحميل بيانات المشروع...
          </p>
        </div>
      </main>
    );
  }
  const title = projectDisplayTitle(project.titel, project.project_summary);
  const st = (project.readiness_status || "open").toLowerCase();
  let statusText = "متاح للمناقشة";
  let statusClass =
    "rounded-lg border border-gray-200 bg-gray-100 text-[10px] font-extrabold uppercase tracking-widest text-gray-600 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-400";
  if (st.includes("progress") || st.includes("قيد")) {
    statusText = "مرحلة التنفيذ";
    statusClass =
      "rounded-lg border border-[#FBBC04]/20 bg-[#FBBC04]/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#FBBC04]";
  } else if (st.includes("complet") || st.includes("مكتمل")) {
    statusText = "جاهز للتطبيق المهني";
    statusClass =
      "rounded-lg border border-[#34A853]/20 bg-[#34A853]/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#34A853]";
  }

  const teamNames = project.participant_names || [];
  const teamEmails = project.participant_emails || [];

  return (
    <main className="relative flex flex-1 flex-col pb-10 pt-6 overflow-x-hidden">
      <Particles />
      <div className="relative z-10 mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold tracking-wide text-gray-500 transition-all hover:translate-x-[-4px] hover:text-[#4285F4] dark:text-gray-400 dark:hover:text-blue-400"
        >
          <ArrowRight className="h-4 w-4 rotate-180" />
          العودة للوحة المشاريع
        </Link>

        <div className="space-y-6">
          <div className="animate-fade-up flex flex-col items-start justify-between gap-8 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900 md:flex-row">
            <div className="flex-1 w-full">
              <div className="mb-5 flex items-center justify-between w-full">
                <div className="flex flex-wrap items-center gap-3">
                  {(project.categories && project.categories.length > 0) ? (
                    project.categories.slice(0, 3).map((cat, idx) => (
                      <span key={idx} className="rounded-lg border border-[#4285F4]/20 bg-[#4285F4]/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#4285F4] dark:bg-[#4285F4]/20 dark:text-blue-400">
                        {cat}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-lg border border-[#4285F4]/20 bg-[#4285F4]/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#4285F4] dark:bg-[#4285F4]/20 dark:text-blue-400">
                      {project.scientific_department}
                    </span>
                  )}
                  <span className={statusClass}>{statusText}</span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={toggleBookmark}
                  disabled={bookmarkLoading}
                  className="p-1 transition-colors hover:text-[#4285F4]"
                >
                  <Bookmark className={`h-7 w-7 transition-colors ${isBookmarked ? 'fill-[#4285F4] text-[#4285F4]' : 'text-gray-300 dark:text-gray-500'}`} />
                </motion.button>
              </div>
              <h1 className="mb-4 pr-2 text-2xl font-extrabold leading-tight tracking-tight text-gray-900 transition-colors dark:text-white">
                {title}
              </h1>
              <p className="text-sm font-medium leading-relaxed text-gray-600 transition-colors dark:text-gray-300">
                {project.project_summary || "الملخص التعريفي للمشروع غير متاح حالياً للمراجعة."}
              </p>
            </div>
          </div>

          <div className="animate-fade-up relative overflow-hidden rounded-3xl border border-gray-800 bg-gray-900 p-8 text-white shadow-xl transition-all hover:shadow-2xl dark:border-slate-800 dark:bg-slate-950 dark:shadow-blue-900/10">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#4285F4]/20 blur-3xl animate-slow-spin dark:bg-[#4285F4]/10" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#34A853]/10 blur-3xl animate-slow-spin dark:bg-[#34A853]/5" style={{ animationDirection: 'reverse' }} />

            <div className="relative z-10 flex flex-col items-center gap-8 pl-4 md:flex-row md:items-start md:pl-0">
              {aiScore !== null ? (
                <ScoreCircle score={aiScore} label={aiLabel} />
              ) : (
                <div className="flex h-32 w-32 animate-pulse items-center justify-center rounded-full bg-gray-700 dark:bg-slate-800" />
              )}
              <div className="mt-4 w-full flex-1 text-center md:mt-0 md:text-right">
                <div className="mb-5 flex flex-col items-center justify-center gap-4 md:flex-row md:justify-start">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white shadow-sm backdrop-blur-sm transition-colors dark:bg-white/5 animate-gentle-pulse">
                    <BrainCircuit className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-white">التحليل الاستراتيجي</h2>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#4285F4] dark:text-blue-400">
                      {analysisSubtitle}
                    </p>
                  </div>
                </div>
                <div
                  className="min-h-[140px] rounded-2xl border border-gray-700 bg-gray-800/50 p-6 text-sm font-medium leading-loose text-gray-300 shadow-inner transition-colors duration-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-gray-300"
                  dangerouslySetInnerHTML={{
                    __html: analysisHtml || '<div class="animate-pulse space-y-3"><div class="h-3 bg-gray-700 rounded w-5/6"/><div class="h-3 bg-gray-700 rounded w-full"/></div>',
                  }}
                />
              </div>
            </div>
          </div>

          <div className="animate-fade-up grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
              <div>
                <h3 className="mb-3 text-center text-[10px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-500 sm:text-right">
                  جهة الإشراف الأكاديمي
                </h3>
                <div className="flex items-center justify-center gap-3 sm:justify-start">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-500 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-gray-400">
                    <User className="h-5 w-5" />
                  </div>
                  <p className="text-lg font-extrabold tracking-tight text-gray-900 transition-colors dark:text-white">
                    {project.supervisor_name || "غير مجدول"}
                  </p>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-6 transition-colors dark:border-slate-800">
                <h3 className="mb-3 text-center text-[10px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-500 sm:text-right">
                  المرحلة الدراسية
                </h3>
                <p className="inline-block rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-bold text-gray-700 shadow-inner transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300">
                  {project.academic_stage || "—"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-4 text-[10px] font-extrabold uppercase tracking-widest text-gray-400 transition-colors dark:text-gray-500">
                التقنيات المستخدمة بالبرمجة والتطوير
              </h3>
              <div className="flex flex-wrap gap-2">
                {(project.skills_used || []).length === 0 ? (
                  <span className="text-sm font-medium text-gray-400">غير مجدول</span>
                ) : (
                  (project.skills_used || []).map((sk) => (
                    <span
                      key={sk}
                      className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-gray-700 shadow-sm transition-all hover:scale-105 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
                    >
                      {sk}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="animate-fade-up mt-8 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-green-200 bg-green-50 text-green-600 transition-colors dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400 animate-gentle-pulse">
                <MailPlus className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 transition-colors dark:text-white">الاتصال المباشر بالفريق المطور</h2>
                <p className="mt-1 text-xs font-semibold text-gray-500 transition-colors dark:text-gray-400">
                  يمكن للشركات المهتمة التواصل مع المطورين مباشرة لتبني المشروع
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {teamNames.length === 0 ? (
                <div className="col-span-1 rounded-xl border border-gray-200 bg-gray-50 p-5 text-center transition-colors dark:border-slate-700 dark:bg-slate-800">
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400">بيانات الفريق غير مسجلة حالياً</p>
                </div>
              ) : (
                teamNames.map((n, i) => {
                  const e = teamEmails[i] || "";
                  return (
                    <div
                      key={i}
                      className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#4285F4]/30 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-500/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-extrabold text-gray-600 transition-colors group-hover:bg-[#4285F4]/10 group-hover:text-[#4285F4] dark:bg-slate-800 dark:text-gray-300 dark:group-hover:bg-[#4285F4]/20 dark:group-hover:text-blue-400">
                          {n[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-gray-900 transition-colors dark:text-white">{n}</h4>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 transition-colors dark:text-gray-500">
                            مطور بالمشروع
                          </p>
                        </div>
                      </div>
                      {e ? (
                        <a
                          href={`mailto:${e}?subject=${encodeURIComponent(`استفسار بخصوص مشروع: ${title}`)}`}
                          className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-[#4285F4] transition-all hover:translate-x-[-2px] hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {e}
                        </a>
                      ) : (
                        <span className="mt-3 block text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                          البريد الإلكتروني غير متوفر
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Human Rating & Feedback System */}
          <div className="animate-fade-up mt-8 items-start rounded-3xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-6 text-xl font-extrabold text-gray-900 transition-colors dark:text-white">التقييم البشري والملاحظات</h2>

            {hasVoted ? (
              <div className="rounded-2xl bg-green-50 p-6 border border-green-200 dark:bg-green-500/10 dark:border-green-500/20 text-center transition-colors">
                <p className="text-sm font-bold text-green-700 dark:text-green-400">شكراً لك! تم تسجيل تقييمك مسبقاً لهذا المشروع.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 transition-colors dark:border-slate-700 dark:bg-slate-800/50">
                <div className="mb-5">
                  <label className="mb-3 block text-sm font-extrabold text-gray-700 dark:text-gray-300">تقييمك للمشروع</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition-transform hover:scale-110 focus:outline-none"
                      >
                        <Star
                          className={`h-8 w-8 ${star <= (hoverRating || rating)
                              ? "fill-[#FBBC04] text-[#FBBC04]"
                              : "text-gray-300 dark:text-slate-600"
                            } transition-colors duration-200`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-5">
                  <label htmlFor="feedback" className="mb-3 block text-sm font-extrabold text-gray-700 dark:text-gray-300">نصائح أو تعديلات مقترحة (اختياري)</label>
                  <textarea
                    id="feedback"
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="اكتب ملاحظاتك هنا بناءً على تقييمك للجانب الفني والعملي للمشروع..."
                    className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all focus:border-[#4285F4] focus:outline-none focus:ring-2 focus:ring-[#4285F4] dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-gray-500"
                  />
                </div>

                <button
                  onClick={handleSubmitFeedback}
                  disabled={rating === 0 || isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4285F4] px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-slate-900"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "إرسال التقييم"}
                </button>
              </div>
            )}

            {/* Revews List */}
            <div className="mt-10 border-t border-gray-100 pt-8 transition-colors dark:border-slate-800">
              <h3 className="mb-6 text-lg font-extrabold text-gray-900 transition-colors dark:text-white">المراجعات السابقة</h3>

              {feedbacksLoading ? (
                <div className="flex items-center justify-center py-8 text-gray-400 dark:text-gray-500">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : feedbacks.length === 0 ? (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 text-center transition-colors dark:border-slate-800 dark:bg-slate-800/50">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    لا توجد مراجعات أو تقييمات حتى الآن. كن أول من يقيّم هذا المشروع!
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                  {feedbacks.map((fb) => (
                    <div key={fb.id} className="rounded-xl border border-gray-100 bg-gray-50 p-5 transition-colors dark:border-slate-700 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 shadow-sm hover:shadow-md duration-300">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${star <= fb.rating ? "fill-[#FBBC04] text-[#FBBC04]" : "text-gray-300 dark:text-slate-600"
                                }`}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                            {new Date(fb.created_at).toLocaleDateString("ar-EG")}
                          </span>
                          {profile?.is_admin && (
                            <button onClick={() => handleDeleteFeedback(fb.id)} className="text-red-400 hover:text-red-500 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      {fb.comment && (
                        <p className="text-sm font-medium leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-line">{fb.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {relatedProjects.length > 0 && (
            <div className="animate-fade-up mt-8 items-start rounded-3xl border border-gray-200 bg-white p-8 shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-6 text-xl font-extrabold text-gray-900 transition-colors dark:text-white">مشاريع مشابهة قد تهمك</h2>
              <div className="grid gap-6 md:grid-cols-3">
                {relatedProjects.map((p) => {
                  const title = projectDisplayTitle(p.titel, p.project_summary);
                  const desc = p.project_summary ? `${p.project_summary.substring(0, 80)}...` : '';
                  const dept = (p.categories && p.categories.length > 0) ? p.categories[0] : p.scientific_department;
                  return (
                    <Link key={p.id} href={`/projects/${p.id}`} className="group flex flex-col rounded-2xl border border-gray-100 bg-gray-50 p-5 transition-all hover:border-[#4285F4]/30 hover:bg-white hover:shadow-md dark:border-slate-700 dark:bg-slate-800/50 dark:hover:bg-slate-800">
                      <span className="mb-3 w-max rounded-md bg-[#4285F4]/10 px-2 py-1 text-[10px] font-extrabold uppercase text-[#4285F4] dark:bg-[#4285F4]/20 dark:text-blue-400">{dept}</span>
                      <h3 className="mb-2 text-sm font-extrabold leading-tight text-gray-900 transition-colors group-hover:text-[#4285F4] dark:text-white dark:group-hover:text-blue-400">
                        {title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}