"use client";

import { BotMessageSquare, Send, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { chatAnalyze } from "@/lib/api";
import { cleanAIResponse, extractText } from "@/lib/text";

type Msg = { role: "user" | "assistant"; content: string };

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "مرحباً بك في بوابة الأعمال والمشاريع الأكاديمية (GDGOC Kufa). أنا المستشار الذكي، كيف يمكنني مساعدتك في البحث عن تقنيات لتطوير شركتك اليوم؟",
    },
  ]);
  const [typing, setTyping] = useState(false);
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history, typing, open]);

  const addSparkle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const id = Date.now();
    setSparkles((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setSparkles((prev) => prev.filter((s) => s.id !== id));
    }, 500);
  };

  const sendChat = useCallback(async () => {
    const text = input.trim();
    if (!text || typing) return;

    const prevForApi = [...history];
    setInput("");
    setHistory((h) => [...h, { role: "user", content: text }]);
    setTyping(true);

    try {
      const raw = await chatAnalyze(text, prevForApi);
      const parsed = extractText(raw) || raw;
      setHistory((h) => [...h, { role: "assistant", content: parsed.trim() }]);
    } catch {
      setHistory((h) => [
        ...h,
        { role: "assistant", content: "عذراً، يوجد خطأ في الاتصال بالمساعد الذكي." },
      ]);
    } finally {
      setTyping(false);
    }
  }, [history, input, typing]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#4285F4] text-white shadow-lg ring-4 ring-blue-500/30 transition-all hover:scale-110 hover:bg-blue-600 focus:outline-none active:scale-95 animate-gentle-pulse dark:ring-blue-500/20"
        aria-label="فتح المحادثة"
      >
        <BotMessageSquare className="h-6 w-6 animate-pulse" />
      </button>

      <div
        className={`fixed bottom-24 left-6 z-50 flex w-80 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl transition-all duration-300 ease-out will-change-transform dark:border-slate-800 dark:bg-slate-900 sm:w-[380px] ${open ? "pointer-events-auto scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
          }`}
        style={{ height: 480 }}
      >
        <div className="flex flex-shrink-0 items-center justify-between bg-gray-900 px-5 py-4 text-white dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded border border-gray-700 bg-gray-800 transition-colors dark:border-slate-700 dark:bg-slate-800">
              <BotMessageSquare className="h-4 w-4 text-[#4285F4] dark:text-blue-400" />
            </div>
            <div>
              <div className="text-sm font-bold">المساعد الذكي لبوابة الأعمال</div>
              <div className="mt-0.5 flex items-center gap-1 text-[10px] font-medium tracking-wide text-green-400 dark:text-green-500">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400 dark:bg-green-500" />
                متصل الآن
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white focus:outline-none active:scale-90"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto scroll-smooth bg-gray-50 p-5 transition-colors duration-500 dark:bg-slate-800/50"
        >
          {history.map((m, i) => (
            <div
              key={i}
              className={`chat-msg mb-4 flex items-end gap-2.5 message-enter ${m.role === "user" ? "user flex-row-reverse" : "bot"}`}
            >
              <div
                className={`chat-avatar flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${m.role === "user"
                    ? "border border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200"
                    : "chat-avatar bot border border-indigo-200 bg-indigo-100 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                  }`}
              >
                {m.role === "user" ? "U" : <BotMessageSquare className="h-3.5 w-3.5" />}
              </div>
              {m.role === "assistant" ? (
                <div
                  className="chat-bubble max-w-[85%] rounded-xl rounded-br-sm border border-slate-200 bg-slate-50 p-3 text-[13px] leading-relaxed text-slate-800 transition-all dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  dangerouslySetInnerHTML={{ __html: cleanAIResponse(m.content) }}
                />
              ) : (
                <div className="chat-bubble max-w-[85%] rounded-xl rounded-bl-sm bg-[#4285F4] p-3 text-[13px] leading-relaxed text-white">
                  {m.content}
                </div>
              )}
            </div>
          ))}
          {typing && (
            <div className="chat-msg bot message-enter mb-4 flex items-end gap-2.5">
              <div className="chat-avatar bot flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-indigo-200 bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950">
                <BotMessageSquare className="h-3.5 w-3.5 text-indigo-700 dark:text-indigo-300" />
              </div>
              <div className="chat-bubble rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-600 dark:bg-slate-800">
                <span className="typing-dots inline-flex gap-1.5">
                  <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-slate-400 dark:bg-slate-500" style={{ animationDuration: '0.6s' }} />
                  <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-slate-400 dark:bg-slate-500" style={{ animationDelay: '0.2s', animationDuration: '0.6s' }} />
                  <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-slate-400 dark:bg-slate-500" style={{ animationDelay: '0.4s', animationDuration: '0.6s' }} />
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-shrink-0 items-center gap-2 border-t border-gray-200 bg-white px-4 py-3 transition-colors duration-500 dark:border-slate-700 dark:bg-slate-900">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendChat()}
            placeholder="اكتب استفسارك هنا..."
            className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          <button
            type="button"
            onClick={(e) => { sendChat(); addSparkle(e); }}
            disabled={typing}
            className="flex items-center justify-center rounded-lg bg-[#4285F4] p-2.5 text-white transition-all hover:scale-110 hover:bg-blue-600 focus:outline-none active:scale-95 disabled:opacity-50"
            title="إرسال"
          >
            <Send className="h-4 w-4 scale-x-[-1]" />
          </button>
        </div>
      </div>

      {/* Sparkles effect */}
      {sparkles.map((s) => (
        <div
          key={s.id}
          className="fixed pointer-events-none z-50"
          style={{
            left: s.x,
            top: s.y,
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            backgroundColor: '#4285F4',
            boxShadow: '0 0 8px 2px #4285F4',
            animation: 'sparkle-fly 0.5s ease-out forwards',
          }}
        />
      ))}
    </>
  );
}