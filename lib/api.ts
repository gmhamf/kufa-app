import type { BusinessProfile } from "@/lib/profile";
import { extractText } from "@/lib/text";

type ProjectPayload = {
  id?: string;
  scientific_department?: string | null;
  project_summary?: string | null;
  skills_used?: string[] | null;
  supervisor_name?: string | null;
  participant_names?: string[] | null;
  academic_stage?: string | null;
  readiness_status?: string | null;
  titel?: string | null;
};

export async function analyzeProject(
  profile: BusinessProfile,
  project: ProjectPayload,
  action: "score" | "deep_analysis"
): Promise<{ score: number; analysis?: string; reason?: string }> {
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          business_profile: {
            company_name: profile.company_name || "",
            industry: profile.industry || "",
            business_goals: profile.business_goals || "",
          },
          project: {
            id: project.id,
            scientific_department: project.scientific_department || "",
            project_summary: project.project_summary || "",
            skills_used: project.skills_used || [],
            supervisor_name: project.supervisor_name || "",
            participant_names: project.participant_names || [],
            academic_stage: project.academic_stage || "",
            readiness_status: project.readiness_status || "",
            titel: project.titel,
          },
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(typeof errBody.error === "string" ? errBody.error : res.statusText);
      }
      const data = (await res.json()) as { score?: number; analysis?: string; reason?: string };
      return {
        score: Number(data.score) || 0,
        analysis: data.analysis,
        reason: data.reason,
      };
    } catch (err) {
      const msg = String(err instanceof Error ? err.message : err).toLowerCase();
      if (msg.includes("429") || msg.includes("rate")) {
        await new Promise((r) => setTimeout(r, (attempt + 1) * 3000));
        continue;
      }
      return { score: 0, reason: "خطأ في الاتصال بمحرك التحليل." };
    }
  }
  return { score: 0, reason: "تم تجاوز حد الطلبات المتزامنة، يرجى المحاولة لاحقاً." };
}

export async function chatAnalyze(
  message: string,
  history: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "chat", message, history }),
  });
  if (!res.ok) return "عذراً، يوجد خطأ في الاتصال بالمساعد الذكي.";
  const data = (await res.json()) as { response?: string };
  const text = (data.response?.trim() || extractText(data)).trim();
  return text || "عذراً، لم أتمكن من معالجة الطلب.";
}
