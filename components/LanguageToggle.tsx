"use client";

import type { Language } from "@/types/story";

export default function LanguageToggle({
  language,
  onChange,
}: {
  language: Language;
  onChange: (lang: Language) => void;
}) {
  return (
    <div className="flex rounded-full bg-amber-50 p-1 border-2 border-amber-200">
      {(["en", "es"] as Language[]).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => onChange(lang)}
          className={`min-w-[56px] min-h-[48px] rounded-full font-bold text-lg transition-colors ${
            language === lang ? "bg-amber-400 text-purple-900" : "text-purple-400"
          }`}
          aria-pressed={language === lang}
        >
          {lang === "en" ? "🇺🇸 EN" : "🇪🇸 ES"}
        </button>
      ))}
    </div>
  );
}
