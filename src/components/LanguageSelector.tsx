"use client";

import { useEditorStore } from "@/stores/editorStore";
import type { SupportedLanguage } from "@/types/schemas";

/**
 * LanguageSelector (A3)
 *
 * Dropdown-style language selector for JS | TS | Python.
 * Default: JavaScript.
 * On change: updates editorStore.language + Monaco language mode.
 */

const LANGUAGES: { value: SupportedLanguage; label: string; icon: string }[] = [
  { value: "javascript", label: "JavaScript", icon: "JS" },
  { value: "typescript", label: "TypeScript", icon: "TS" },
  { value: "python", label: "Python", icon: "PY" },
];

export default function LanguageSelector() {
  const { language, setLanguage } = useEditorStore();

  return (
    <div
      className="flex items-center rounded-lg overflow-hidden"
      style={{
        border: "1px solid var(--dc-border)",
        background: "var(--dc-bg-tertiary)",
      }}
    >
      {LANGUAGES.map((lang, idx) => (
        <button
          key={lang.value}
          id={`lang-${lang.value}-btn`}
          onClick={() => setLanguage(lang.value)}
          className="px-3 py-1.5 text-xs font-semibold transition-all duration-150"
          title={lang.label}
          style={{
            background:
              language === lang.value ? "var(--dc-accent-blue)" : "transparent",
            color:
              language === lang.value ? "#fff" : "var(--dc-text-muted)",
            borderRight:
              idx < LANGUAGES.length - 1
                ? "1px solid var(--dc-border)"
                : "none",
          }}
        >
          {lang.icon}
        </button>
      ))}
    </div>
  );
}
