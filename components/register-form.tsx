"use client";

import { Building2, Compass, Loader2, Sparkles, LogIn, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { saveGuestProfile } from "@/lib/profile";
import { Particles } from "@/components/particles";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    try {
      const sb = getSupabaseBrowser();
      
      if (isLogin) {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("تم تسجيل الدخول بنجاح!");
        // Hard redirect to force full state refresh with new session
        window.location.href = "/dashboard";
        return;
      } else {
        const company_name = (form.elements.namedItem("companyName") as HTMLInputElement).value.trim();
        const industry = (form.elements.namedItem("industry") as HTMLSelectElement).value;
        const business_goals = (form.elements.namedItem("businessGoals") as HTMLTextAreaElement).value.trim();

        const { data, error: signUpError } = await sb.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        
        if (data.user) {
          const { error: insertError } = await sb.from("business_profiles").insert([{
            id: data.user.id,
            company_name,
            industry,
            business_goals,
            is_admin: false
          }]);
          if (insertError) throw insertError;
        }
        toast.success("تم إنشاء الحساب بنجاح!");
        // Hard redirect to force full state refresh with new session
        window.location.href = "/dashboard";
        return;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      let tMsg = "عذراً، حدث خطأ: " + msg;
      
      const lower = msg.toLowerCase();
      if (lower.includes("invalid login credentials")) {
        tMsg = "البريد الإلكتروني أو كلمة المرور غير صحيحة";
      } else if (lower.includes("already registered") || lower.includes("already exists")) {
        tMsg = "هذا البريد الإلكتروني مسجل بالفعل";
      } else if (lower.includes("password should be") || lower.includes("characters") || lower.includes("weak")) {
        tMsg = "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل";
      } else if (lower.includes("valid") || lower.includes("format")) {
        tMsg = "صيغة البريد الإلكتروني غير صالحة";
      }

      toast.error(tMsg);
    } finally {
      setLoading(false);
    }
  }

  function enterAsGuest() {
    saveGuestProfile();
    router.push("/dashboard");
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <Particles />
      <div className="float-anim absolute -top-10 -right-10 h-40 w-40 rounded-full bg-[#4285F4]/20 blur-3xl dark:bg-[#4285F4]/10 animate-slow-spin" />
      <div className="float-delay absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[#34A853]/20 blur-3xl dark:bg-[#34A853]/10 animate-slow-spin" style={{ animationDirection: 'reverse' }} />

      <div className="animate-fade-up relative rounded-3xl border border-gray-200 bg-white/90 backdrop-blur-md p-6 shadow-xl transition-all hover:border-[#4285F4]/30 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-blue-900/10">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white transition-colors dark:bg-slate-800 dark:text-[#4285F4] animate-gentle-pulse">
            {isLogin ? <LogIn className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-gray-900 transition-colors dark:text-white">
              {isLogin ? "تسجيل الدخول" : "إنشاء حساب شركة"}
            </h2>
            <p className="mt-0.5 text-xs font-semibold text-gray-500 transition-colors dark:text-gray-400">
              {isLogin ? "مرحباً بعودتك للمنصة" : "اكتشف وادعم المشاريع التطبيقية"}
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="relative flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-700 transition-colors dark:text-gray-300">البريد الإلكتروني</label>
              <input required name="email" type="email" placeholder="example@company.com" className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 outline-none transition-all placeholder-gray-400 focus:border-[#4285F4] focus:bg-white focus:ring-2 focus:ring-[#4285F4]/50 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white dark:focus:bg-slate-900" />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-700 transition-colors dark:text-gray-300">كلمة المرور</label>
              <input required name="password" type="password" placeholder="••••••••" className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 outline-none transition-all placeholder-gray-400 focus:border-[#4285F4] focus:bg-white focus:ring-2 focus:ring-[#4285F4]/50 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white dark:focus:bg-slate-900" />
            </div>
          </div>

          <AnimatePresence>
            {!isLogin && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-700 transition-colors dark:text-gray-300">الاسم التجاري</label>
                    <input required={!isLogin} name="companyName" type="text" placeholder="مثال: شركة الحلول الصناعية" className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 outline-none transition-all placeholder-gray-400 focus:border-[#4285F4] focus:bg-white focus:ring-2 focus:ring-[#4285F4]/50 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white dark:focus:bg-slate-900" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-700 transition-colors dark:text-gray-300">القطاع</label>
                    <select required={!isLogin} name="industry" className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 outline-none transition-all focus:border-[#4285F4] focus:bg-white focus:ring-2 focus:ring-[#4285F4]/50 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white dark:focus:bg-slate-900">
                      <option value="" className="dark:bg-slate-800">تحديد قطاع العمل...</option>
                      <option value="Agriculture" className="dark:bg-slate-800">الزراعة والصناعات الغذائية</option>
                      <option value="Healthcare" className="dark:bg-slate-800">الرعاية الصحية والطبية</option>
                      <option value="Education" className="dark:bg-slate-800">تكنولوجيا التعليم</option>
                      <option value="FinTech" className="dark:bg-slate-800">التقنية المالية والخدمات</option>
                      <option value="Construction" className="dark:bg-slate-800">المقاولات والتشييد</option>
                      <option value="E-Commerce" className="dark:bg-slate-800">التجارة الإلكترونية</option>
                      <option value="Energy" className="dark:bg-slate-800">الطاقة والبيئة</option>
                      <option value="AI & Data" className="dark:bg-slate-800">الذكاء الاصطناعي</option>
                      <option value="Telecom" className="dark:bg-slate-800">الاتصالات والشبكات</option>
                      <option value="Other" className="dark:bg-slate-800">قطاع آخر</option>
                    </select>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-700 transition-colors dark:text-gray-300">التوجه الاستراتيجي</label>
                    <textarea required={!isLogin} name="businessGoals" rows={2} placeholder="يرجى إيضاح مجالات اهتمام الشركة..." className="w-full resize-none rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 outline-none transition-all placeholder-gray-400 focus:border-[#4285F4] focus:bg-white focus:ring-2 focus:ring-[#4285F4]/50 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white dark:focus:bg-slate-900" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button type="submit" disabled={loading} className="group flex w-full flex-row-reverse items-center justify-center gap-2 rounded-xl bg-[#4285F4] py-2.5 font-bold text-white shadow-lg transition-all hover:bg-blue-600 active:scale-95 disabled:opacity-70 dark:shadow-blue-900/20">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
              <>
                <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12 group-hover:scale-110" />
                <span>{isLogin ? "تسجيل الدخول" : "إنشاء حساب"}</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-xs font-bold text-gray-500 hover:text-[#4285F4] dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
            {isLogin ? "إنشاء حساب جديد" : "لديك حساب؟ سجل دخولك"}
          </button>
          
          <button type="button" onClick={enterAsGuest} className="group flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-xs font-bold text-gray-700 transition-all hover:bg-white hover:border-[#4285F4] hover:text-[#4285F4] active:scale-95 dark:border-slate-700 dark:bg-slate-800/80 dark:text-gray-300 dark:hover:bg-slate-700 dark:hover:text-white shrink-0">
            <Compass className="h-4 w-4 transition-transform group-hover:rotate-12 group-hover:scale-110" />
            <span>تصفح كزائر</span>
          </button>
        </div>
      </div>
    </div>
  );
}