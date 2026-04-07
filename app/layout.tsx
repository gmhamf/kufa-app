import type { Metadata, Viewport } from "next";
import { Noto_Kufi_Arabic } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { ChatWidget } from "@/components/chat-widget";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "react-hot-toast";

const noto = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-noto",
});

export const metadata: Metadata = {
  title: "بوابة الأعمال — GDGOC Kufa",
  description:
    "منصة ربط قطاع الأعمال بمشاريع التخرج الأكاديمية المدعومة بالذكاء الاصطناعي.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${noto.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body
        className={`${noto.className} flex min-h-screen flex-col overflow-x-hidden bg-gray-50 text-gray-900 antialiased transition-colors duration-500 dark:bg-slate-950 dark:text-slate-100`}
      >
        <ThemeProvider>
          <Navbar />
          <div className="flex flex-1 flex-col pt-12">{children}</div>
          <SiteFooter />
          <ChatWidget />
          <Toaster
            position="bottom-center"
            toastOptions={{
              className: "font-bold border border-gray-200 bg-white text-gray-900 shadow-xl dark:border-slate-700 dark:bg-slate-800 dark:text-white",
              duration: 4000,
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}