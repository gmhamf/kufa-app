import { Briefcase, Lightbulb } from "lucide-react";
import { RegisterForm } from "@/components/register-form";

export default function HomePage() {
  return (
    <main className="min-h-[90vh] pb-16 pt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid min-h-[70vh] items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="mb-6 flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#4285F4] animate-bounce-dot" style={{ animationDelay: "0s" }} />
              <span className="h-2.5 w-2.5 rounded-full bg-[#EA4335] animate-bounce-dot" style={{ animationDelay: "0.15s" }} />
              <span className="h-2.5 w-2.5 rounded-full bg-[#FBBC04] animate-bounce-dot" style={{ animationDelay: "0.3s" }} />
              <span className="h-2.5 w-2.5 rounded-full bg-[#34A853] animate-bounce-dot" style={{ animationDelay: "0.45s" }} />
            </div>
            <h1 className="mb-4 text-2xl font-extrabold leading-tight tracking-tight text-gray-900 transition-colors dark:text-white sm:text-3xl">
              منصة ربط الأعمال
              <br />
              <span className="bg-gradient-to-l from-[#4285F4] to-[#34A853] bg-clip-text text-transparent">
                والمشاريع الأكاديمية
              </span>
            </h1>
            <p className="mb-8 max-w-lg text-lg font-medium leading-relaxed text-gray-600 transition-colors dark:text-gray-300">
              منصة مهنية مدمجة بالذكاء الاصطناعي تهدف لربط الشركات الرائدة والمستثمرين بالكوادر والبحوث الأكاديمية
              النوعية لجامعة الكوفة.
            </p>
            <div className="flex flex-col gap-6 text-sm font-bold text-gray-600 transition-colors dark:text-gray-400 sm:flex-row">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4285F4]/10 text-[#4285F4] transition-colors dark:bg-[#4285F4]/20 dark:text-blue-400">
                  <Briefcase className="h-5 w-5" />
                </div>
                <span>استثمار المهارات</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#34A853]/10 text-[#34A853] transition-colors dark:bg-[#34A853]/20 dark:text-green-400">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <span>مشاريع نوعية وتطبيقية</span>
              </div>
            </div>
          </div>

          <RegisterForm />
        </div>
      </div>
    </main>
  );
}