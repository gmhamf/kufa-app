"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getProfile, type BusinessProfile } from "@/lib/profile";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { Loader2, Plus, Edit, Trash2, ShieldAlert, X, Save } from "lucide-react";
import { Particles } from "@/components/particles";
import { motion, AnimatePresence } from "framer-motion";

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

export default function AdminDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    titel: "",
    project_summary: "",
    scientific_department: "",
    categories_str: "",
    supervisor_name: "",
    participant_names_str: "",
    skills_used_str: ""
  });

  useEffect(() => {
    let cancelled = false;
    getProfile().then(p => {
      if (cancelled) return;
      if (!p || !p.is_admin) {
        router.replace("/dashboard");
      } else {
        setProfile(p);
      }
    });
    return () => { cancelled = true; };
  }, [router]);

  useEffect(() => {
    if (!profile?.is_admin) return;
    fetchProjects();
  }, [profile]);

  const fetchProjects = async () => {
    setLoading(true);
    const sb = getSupabaseBrowser();
    const { data } = await sb.from("projects").select("*").order("created_at", { ascending: false });
    if (data) setProjects(data as ProjectRow[]);
    setLoading(false);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`هل أنت متأكد من حذف المشروع: "${title}"؟`)) return;
    const sb = getSupabaseBrowser();
    await sb.from("projects").delete().eq("id", id);
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const openModal = (proj: ProjectRow | null = null) => {
    if (proj) {
      setEditingId(proj.id);
      setFormData({
        titel: proj.titel || "",
        project_summary: proj.project_summary || "",
        scientific_department: proj.scientific_department || "",
        categories_str: proj.categories?.join("، ") || "",
        supervisor_name: proj.supervisor_name || "",
        participant_names_str: proj.participant_names?.join("، ") || "",
        skills_used_str: proj.skills_used?.join("، ") || ""
      });
    } else {
      setEditingId(null);
      setFormData({
        titel: "", project_summary: "", scientific_department: "", categories_str: "", supervisor_name: "", participant_names_str: "", skills_used_str: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // transform strings to arrays
    const categories = formData.categories_str.split("،").map(s => s.trim()).filter(Boolean);
    const participant_names = formData.participant_names_str.split("،").map(s => s.trim()).filter(Boolean);
    const skills_used = formData.skills_used_str.split("،").map(s => s.trim()).filter(Boolean);

    const payload = {
      titel: formData.titel || null,
      project_summary: formData.project_summary || null,
      scientific_department: formData.scientific_department,
      categories: categories.length > 0 ? categories : null,
      supervisor_name: formData.supervisor_name || null,
      participant_names: participant_names.length > 0 ? participant_names : null,
      skills_used: skills_used.length > 0 ? skills_used : null
    };

    const sb = getSupabaseBrowser();

    if (editingId) {
      await sb.from("projects").update(payload).eq("id", editingId);
    } else {
      await sb.from("projects").insert(payload);
    }

    await fetchProjects();
    setSaving(false);
    setIsModalOpen(false);
  };

  if (!profile || !profile.is_admin) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-[#4285F4]" />
      </div>
    );
  }

  return (
    <main className="relative pb-10 pt-6 overflow-x-hidden min-h-screen bg-gray-50 dark:bg-slate-950">
      <Particles />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end bg-white dark:bg-slate-900 p-8 rounded-3xl border border-red-500/20 shadow-sm animate-fade-up">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-red-500/10 text-red-500 p-2 rounded-xl">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">لوحة الإدارة</h1>
            </div>
            <p className="font-medium text-gray-500 transition-colors dark:text-gray-400">
              إدارة المشروعات بالكامل: إضافة وتعديل وحذف السجلات الأكاديمية.
            </p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 rounded-xl bg-[#4285F4] px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-600 active:scale-95"
          >
            <Plus className="h-5 w-5" />
            إضافة مشروع جديد
          </button>
        </div>

        {/* Dashboard Table */}
        <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-colors dark:border-slate-800 dark:bg-slate-900 animate-fade-up">
          {loading ? (
            <div className="p-10 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm text-gray-500 dark:text-gray-400">
                <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-slate-800 dark:text-gray-300">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-extrabold">عنوان المشروع</th>
                    <th scope="col" className="px-6 py-4 font-extrabold">القسم / الفئات</th>
                    <th scope="col" className="px-6 py-4 font-extrabold">المشرف</th>
                    <th scope="col" className="px-6 py-4 font-extrabold text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {projects.map((proj) => (
                    <motion.tr 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={proj.id} 
                      className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white max-w-xs truncate">
                        {proj.titel || "بدون عنوان"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                          {proj.categories?.[0] || proj.scientific_department}
                        </span>
                      </td>
                      <td className="px-6 py-4 truncate max-w-[150px]">
                        {proj.supervisor_name || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={() => openModal(proj)} className="text-gray-400 hover:text-[#4285F4] transition-colors">
                            <Edit className="h-5 w-5" />
                          </button>
                          <button onClick={() => handleDelete(proj.id, proj.titel || "مشروع")} className="text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {projects.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center font-medium">لا توجد مشاريع</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* CRUD Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-800">
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
                  {editingId ? "تعديل المشروع" : "إضافة مشروع جديد"}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto overflow-x-hidden custom-scrollbar">
                <form id="project-form" onSubmit={handleSave} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">عنوان المشروع</label>
                    <input required type="text" value={formData.titel} onChange={e => setFormData({...formData, titel: e.target.value})} className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4] dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">القسم العلمي (رئيسي)</label>
                    <input required type="text" value={formData.scientific_department} onChange={e => setFormData({...formData, scientific_department: e.target.value})} className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4] dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">الفئات / التاجات (مفصولة بفاصلة عربية ،)</label>
                    <input type="text" placeholder="مثال: ذكاء اصطناعي، ويب، خوارزميات" value={formData.categories_str} onChange={e => setFormData({...formData, categories_str: e.target.value})} className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4] dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">الملخص التنفيذي</label>
                    <textarea rows={4} value={formData.project_summary} onChange={e => setFormData({...formData, project_summary: e.target.value})} className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4] dark:border-slate-700 dark:bg-slate-800 dark:text-white resize-none" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">المشرف</label>
                      <input type="text" value={formData.supervisor_name} onChange={e => setFormData({...formData, supervisor_name: e.target.value})} className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4] dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">المطورين (مفصولين بفاصلة ،)</label>
                      <input type="text" value={formData.participant_names_str} onChange={e => setFormData({...formData, participant_names_str: e.target.value})} className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4] dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">التقنيات المستخدمة (مفصولة بفاصلة ،)</label>
                    <input type="text" value={formData.skills_used_str} onChange={e => setFormData({...formData, skills_used_str: e.target.value})} className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4] dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors">
                  إلغاء
                </button>
                <button form="project-form" type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#4285F4] hover:bg-blue-600 text-white font-bold transition-colors shadow-md disabled:opacity-50">
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  حفظ البيانات
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}
