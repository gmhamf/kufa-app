export function extractText(value: unknown): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        return extractText(JSON.parse(trimmed) as unknown);
      } catch {
        /* not valid JSON */
      }
    }
    return value;
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.values(value as Record<string, unknown>)
      .map((v) => extractText(v))
      .filter((s) => s && s.trim().length > 0)
      .join(" ");
  }
  if (Array.isArray(value)) {
    return value.map((v) => extractText(v)).filter(Boolean).join(" ");
  }
  return "";
}

export function cleanAIResponse(text: string): string {
  if (!text) return "";
  let t = text;
  t = t.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#4285F4] underline">$1</a>'
  );
  t = t.replace(/\[([^\]]+)\]/g, "$1");
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  t = t.replace(
    /`([^`]+)`/g,
    '<code class="bg-gray-100 dark:bg-slate-700 px-1 rounded text-xs font-mono">$1</code>'
  );
  t = t.replace(/\n/g, "<br>");
  return t;
}

export function projectDisplayTitle(titel: string | null | undefined, summary: string | null | undefined) {
  if (titel?.trim()) return titel.trim();
  if (!summary?.trim()) return "مشروع أكاديمي";
  const s = summary.trim();
  const cut = s.length > 100 ? `${s.slice(0, 100)}…` : s;
  return cut;
}
