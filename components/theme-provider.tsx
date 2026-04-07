"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type ThemeContextValue = {
  dark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const themeListeners = new Set<() => void>();

function subscribeTheme(onStoreChange: () => void) {
  themeListeners.add(onStoreChange);
  return () => themeListeners.delete(onStoreChange);
}

function emitThemeChange() {
  themeListeners.forEach((l) => l());
}

function getThemeSnapshot(): boolean {
  return (
    typeof window !== "undefined" &&
    (localStorage.theme === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches))
  );
}

function getServerThemeSnapshot(): boolean {
  return false;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const dark = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const toggleTheme = useCallback(() => {
    const next = !getThemeSnapshot();

    // السحر هنا: استخدام View Transitions API لتفعيل أنيميشن ناعم على مستوى الشاشة كلها
    if (typeof document !== "undefined" && document.startViewTransition) {
      document.startViewTransition(() => {
        // نغير الكلاس فوراً بداخل الأنيميشن حتى المتصفح يلقط اللقطة بسلاسة
        document.documentElement.classList.toggle("dark", next);
        localStorage.theme = next ? "dark" : "light";
        emitThemeChange();
      });
    } else {
      // الطريقة العادية إذا كان المتصفح قديم وما يدعم الأنيميشن
      localStorage.theme = next ? "dark" : "light";
      emitThemeChange();
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ dark, toggleTheme }}>{children}</ThemeContext.Provider>
  );
}