import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

// ─── دالة استخراج JSON بأمان لتجنب انهيار التقييم ───
function extractAndParseJson(text: string) {
  try {
    const cleanText = text.replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, "").trim();
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, business_profile: profile, project, message, history } = body;
    const supabase = createServiceRoleClient();

    const isGuest = !profile?.company_name || profile.company_name.length < 3;

    // ── 1. التحليل الاستراتيجي (Score) بالمعايير الجديدة ──
    if (action === "score" || action === "deep_analysis") {
      if (!project?.project_summary) {
        return NextResponse.json({ analysis: "البيانات غير كافية للتحليل.", score: 0 });
      }

      // تحديد قواعد التقييم بناءً على نوع المستخدم (زائر vs شركة)
      const scoringRules = isGuest
        ? `[معايير الزائر]:
           - 70% إلى 80% من التقييم يعتمد على: (الفكرة، مدى إفادتها للحياة اليومية، تسهيل المهام الشخصية).
           - 20% إلى 30% يعتمد على: (التقنيات المستخدمة).`
        : `[معايير الشركة (${profile.company_name})]:
           - 80% من التقييم يعتمد على: (التطابق مع البزنس، الفائدة التجارية لقطاع ${profile.industry}، حل المشاكل).
           - 20% يعتمد على: (التقنيات المستخدمة والبرمجة).`;

      const systemPrompt = `
        أنت محلل خبير. اعتمد 100% على الوصف والتقنيات المقدمة فقط. لا تخترع معلومات.
        ${scoringRules}
        
        [قواعد النسبة]: 
        - لا تعطي أقل من 40% إذا كان المشروع له فكرة واضحة.
        - قيّم بواقعية بناءً على المعايير أعلاه.
        
        المخرجات JSON حصراً: {"analysis": "تحليل يركز على الفكرة والتطابق أولاً ثم التقنيات", "score": <النسبة>}
      `;

      const userPrompt = `المشروع: "${project.titel}". الوصف: ${project.project_summary}. التقنيات: ${JSON.stringify(project.skills_used || [])}`;

      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
          temperature: 0.2, // حرارة منخفضة لضمان الالتزام بالمعايير
          response_format: { type: "json_object" }
        }),
      });

      const data = await res.json();
      const parsed = extractAndParseJson(data.choices[0].message.content);
      return NextResponse.json(parsed || { analysis: "حدث خطأ في استخراج النسبة.", score: 50 });
    }

    // ── 2. الدردشة الذكية (نظام البحث والمطابقة) ──
    if (action === "chat") {
      const userMsg = message.trim();

      // أ. جلب جميع العناوين من قاعدة البيانات
      const { data: allTitles } = await supabase.from('projects').select('id, titel');

      // ب. البحث عن كلمات مطابقة في العناوين
      const words = userMsg.split(/\s+/).filter((w: string) => w.length > 2); // الكلمات الأطول من حرفين
      let matchedIds: any[] = [];

      if (allTitles) {
        matchedIds = allTitles
          .filter(p => words.some((w: string) => p.titel?.toLowerCase().includes(w.toLowerCase())))
          .map(p => p.id)
          .slice(0, 4); // جلب أول 4 مشاريع مطابقة لتجنب الضغط
      }

      // ج. جلب التفاصيل للمشاريع المطابقة
      let detailedContext = "";
      if (matchedIds.length > 0) {
        const { data: details } = await supabase
          .from('projects')
          .select('titel, project_summary, skills_used, participant_emails')
          .in('id', matchedIds);

        detailedContext = details?.map(d => {
          const hasSkills = d.skills_used && d.skills_used.length > 0;
          return `
- العنوان: ${d.titel}
- الوصف: ${d.project_summary?.slice(0, 300)}
- التقنيات: ${hasSkills ? d.skills_used.join(", ") : "نقص في البيانات (غير متوفرة)"}
- إيميل القائمين عليه: ${d.participant_emails || "غير متوفر في القاعدة"}
          `.trim();
        }).join("\n\n---\n\n") || "";
      }

      const identity = isGuest
        ? "أنت مساعد تقني. ركز على كيف يفيد المشروع المستخدم في حياته اليومية."
        : `أنت مساعد تقني لشركة ${profile.company_name}. ركز على كيف يخدم المشروع البزنس الخاص بهم.`;

      const chatSystem = `
        ${identity}
        
        [تعليمات صارمة لا تتجاوزها]:
        1. اعتمد 100% على البيانات الموجودة أدناه. ممنوع إعطاء معلومات من خارج قاعدة البيانات.
        2. إذا وجدت أكثر من مشروع مطابق، اذكر أسماءها للمستخدم.
        3. افحص المعلومات (التقنيات). إذا كانت التقنيات مكتوب أمامها "نقص في البيانات"، أخبر المستخدم بذلك فوراً، وقدم له "إيميل القائمين عليه" ليراسلهم ويسألهم.
        4. لا تخترع لغات برمجة أو أرقام هواتف.
        
        [المشاريع التي طابقت بحث المستخدم من القاعدة]:
        ${detailedContext || "لم يتم العثور على مشروع بهذا الاسم الدقيق. اطلب من المستخدم توضيح الاسم، أو أجب بناءً على سياق المنصة."}
        
        [عناوين كل المشاريع المتاحة في المنصة (للمعرفة فقط)]:
        ${allTitles?.map(t => t.titel).join(" | ").slice(0, 1000)}...
      `;

      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: chatSystem },
            ...(history || []).slice(-3),
            { role: "user", content: userMsg }
          ],
          temperature: 0.3 // حرارة منخفضة لمنع "الفتوى"
        }),
      });

      const data = await res.json();
      return NextResponse.json({ response: data.choices[0].message.content.replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, "") });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("API Error:", err.message);
    return NextResponse.json({ response: "عذراً، حدث خطأ أثناء البحث في قاعدة البيانات. هل يمكنك إعادة المحاولة؟" });
  }
}