import { Briefcase, Lightbulb } from "lucide-react";
import { RegisterForm } from "@/components/register-form";

export default function HomePage() {
  return (
    <main className="min-h-[90vh] overflow-x-hidden pb-10 pt-6 sm:pb-16 sm:pt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid min-h-0 items-center gap-8 sm:gap-10 lg:min-h-[70vh] lg:grid-cols-2 lg:gap-12">

          {/* Hero Content */}
          <div className="text-center lg:text-right">
            {/* Google-style dots */}
            <div className="mb-4 flex justify-center gap-1.5 sm:mb-6 lg:justify-start">
              <span className="h-2 w-2 rounded-full bg-[#4285F4] animate-bounce-dot sm:h-2.5 sm:w-2.5" style={{ animationDelay: "0s" }} />
              <span className="h-2 w-2 rounded-full bg-[#EA4335] animate-bounce-dot sm:h-2.5 sm:w-2.5" style={{ animationDelay: "0.15s" }} />
              <span className="h-2 w-2 rounded-full bg-[#FBBC04] animate-bounce-dot sm:h-2.5 sm:w-2.5" style={{ animationDelay: "0.3s" }} />
              <span className="h-2 w-2 rounded-full bg-[#34A853] animate-bounce-dot sm:h-2.5 sm:w-2.5" style={{ animationDelay: "0.45s" }} />
            </div>

            {/* Heading */}
            <h1 className="mb-3 text-xl font-extrabold leading-tight tracking-tight text-gray-900 transition-colors dark:text-white sm:mb-4 sm:text-2xl md:text-3xl">
              منصة ربط الأعمال
              <br />
              <span className="bg-gradient-to-l from-[#4285F4] to-[#34A853] bg-clip-text text-transparent">
                والمشاريع الأكاديمية
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mb-6 max-w-md text-sm font-medium leading-relaxed text-gray-600 transition-colors dark:text-gray-300 sm:mb-8 sm:text-base md:text-lg lg:mx-0 lg:max-w-lg">
              منصة مهنية مدمجة بالذكاء الاصطناعي تهدف لربط الشركات الرائدة والمستثمرين بالكوادر والبحوث الأكاديمية
              النوعية لجامعة الكوفة.
            </p>

            {/* Feature badges */}
            <div className="flex flex-row items-center justify-center gap-4 text-xs font-bold text-gray-600 transition-colors dark:text-gray-400 sm:gap-6 sm:text-sm lg:justify-start">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4285F4]/10 text-[#4285F4] transition-colors dark:bg-[#4285F4]/20 dark:text-blue-400 sm:h-10 sm:w-10">
                  <Briefcase className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <span>استثمار المهارات</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#34A853]/10 text-[#34A853] transition-colors dark:bg-[#34A853]/20 dark:text-green-400 sm:h-10 sm:w-10">
                  <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <span>مشاريع نوعية وتطبيقية</span>
              </div>
            </div>
          </div>

          {/* Register Form */}
          <RegisterForm />

        </div>
      </div>
    </main>
  );
}