"use client";

import { useEditorStore } from "@/stores/editorStore";
import { useSessionStore } from "@/stores/sessionStore";
import type { SupportedLanguage } from "@/types/schemas";
import { motion } from "framer-motion";
import { useState } from "react";
import toast from "react-hot-toast";
import { Beaker, Lightbulb, Sparkles, ChevronDown } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const BOILERPLATES: Record<SupportedLanguage, string> = {
  javascript: `// Add code in JavaScript\n\nconsole.log("Hello World!");`,
  typescript: `// Add code in TypeScript\n\nconsole.log("Hello World!");`,
  python: `# Add code in Python\n\nprint("Hello World!")`,
  java: `// Add code in Java\n\nimport java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World!");\n    }\n}`,
  cpp: `// Add code in C++\n\n#include <iostream>\n\nint main() {\n    std::cout << "Hello World!" << std::endl;\n    return 0;\n}`,
  go: `// Add code in Go\n\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello World!")\n}`,
  rust: `// Add code in Rust\n\nfn main() {\n    println!("Hello World!");\n}`,
  csharp: `// Add code in C#\n\nusing System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello World!");\n    }\n}`
};

const LANGUAGES: { value: SupportedLanguage; label: string; icon: string }[] = [
  { value: "javascript", label: "JavaScript", icon: "JS" },
  { value: "typescript", label: "TypeScript", icon: "TS" },
  { value: "python", label: "Python", icon: "PY" },
  { value: "java", label: "Java", icon: "JAVA" },
  { value: "cpp", label: "C++", icon: "CPP" },
  { value: "go", label: "Go", icon: "GO" },
  { value: "rust", label: "Rust", icon: "RS" },
  { value: "csharp", label: "C#", icon: "CS" },
];

export default function Header() {
  const { code, language, setCode, setLanguage } = useEditorStore();
  const { mode, setMode, totalScore, maxPossibleScore, questions, setSeedSession } =
    useSessionStore();

  const [generatingSeed, setGeneratingSeed] = useState(false);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as SupportedLanguage;
    setLanguage(newLang);
    setCode(BOILERPLATES[newLang]);
  };

  const handleGenerateSeed = async () => {
    const concept = window.prompt("What concept do you want to understand? (e.g. async/await, closures, error handling)");
    if (!concept) return;

    const difficulty = window.prompt("Difficulty? (beginner / intermediate / advanced)", "intermediate");
    if (!difficulty || !["beginner", "intermediate", "advanced"].includes(difficulty)) {
      toast.error("Invalid difficulty. Choose beginner, intermediate, or advanced.");
      return;
    }

    setGeneratingSeed(true);
    try {
      const res = await fetch("/api/generate-seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept, difficulty }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Generation failed");
      }

      const { code } = await res.json();
      setCode(code);
      setSeedSession(concept, true);
      toast.success(`Seed project for ${concept} generated!`);
      
      // Trivia mode is already active or we switch to it
      setMode("trivia");
    } catch (error) {
      console.error("Seed error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate seed project");
    } finally {
      setGeneratingSeed(false);
    }
  };

  const scorePercent =
    maxPossibleScore > 0
      ? Math.round((totalScore / maxPossibleScore) * 100)
      : 0;
  const scoreColor =
    scorePercent >= 80
      ? "var(--dc-success)"
      : scorePercent >= 50
      ? "var(--dc-warning)"
      : "var(--dc-error)";

  return (
    <header className="flex flex-col shrink-0" style={{ backgroundColor: "var(--dc-bg-primary)" }}>
      {/* Top Banner: Logo & Score */}
      <div 
        className="relative flex items-center justify-between px-6 md:px-10 py-2 border-b" 
        style={{ backgroundColor: "var(--dc-bg-primary)", borderColor: "var(--dc-border)" }}
      >
        <div className="flex items-center gap-2.5 group">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#0D9488] flex items-center justify-center shadow-lg shadow-[#0D9488]/20 transition-transform group-hover:scale-110">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 8L12 15L5 22" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 22H20" stroke="rgba(255,255,255,0.8)" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </div>
            {/* Decorative accent */}
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#14B8A6] rounded-full animate-pulse shadow-sm" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-text-primary tracking-tight">
              DeepCode
            </span>
            <span className="text-[10px] font-medium text-text-tertiary tracking-widest uppercase -mt-0.5">
              AI Tutor
            </span>
          </div>
        </div>

        {/* Feature 1 — Seed Project Button */}
        <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 justify-center">
            <button
                onClick={handleGenerateSeed}
                disabled={generatingSeed}
                className="flex items-center gap-2 px-6 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all shadow-md"
                style={{ backgroundColor: "var(--dc-accent-blue)", color: "#fff" }}
            >
                {generatingSeed ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <Sparkles size={14} />
                )}
                Generate Learning Seed
            </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center justify-end gap-6 shrink-0 z-10">
          <ThemeToggle />
          
          {questions.length > 0 && (
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold tracking-wider mb-0.5" style={{ color: "var(--dc-text-muted)" }}>Session Score</span>
              <div 
                className="px-4 py-1.5 rounded-md border flex items-baseline gap-1"
                style={{ color: scoreColor, borderColor: "var(--dc-border)", backgroundColor: "var(--dc-bg-primary)" }}
              >
                <span className="text-xl font-bold font-mono leading-none">{totalScore}</span>
                <span className="text-xs font-mono" style={{ color: "var(--dc-text-muted)" }}>/{maxPossibleScore}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Nav: Tabs and Settings */}
      <div 
        className="flex items-center justify-between px-8 md:px-14 min-h-[45px]" 
        style={{ backgroundColor: "var(--dc-bg-tertiary)" }}
      >
        
        {/* Massive Workspace Tabs */}
        <div className="flex h-full items-end gap-2 pt-2">
          <button
            id="mode-trivia-btn"
            onClick={() => setMode("trivia")}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-bold transition-all`}
            style={{ 
              color: mode === "trivia" ? "var(--dc-text-primary)" : "var(--dc-text-secondary)", 
              backgroundColor: mode === "trivia" ? "var(--dc-bg-elevated)" : "transparent",
              borderColor: mode === "trivia" ? "var(--dc-accent-blue)" : "transparent"
            }}
          >
            <Beaker size={16} /> TRIVIA GAUNTLET
          </button>
          
          <button
            id="mode-understand-btn"
            onClick={() => setMode("understand")}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-bold transition-all`}
             style={{ 
              color: mode === "understand" ? "var(--dc-text-primary)" : "var(--dc-text-secondary)", 
              backgroundColor: mode === "understand" ? "var(--dc-bg-elevated)" : "transparent",
              borderColor: mode === "understand" ? "var(--dc-accent-blue)" : "transparent"
            }}
          >
            <Lightbulb size={16} /> DEEP UNDERSTAND
          </button>
        </div>

        <div className="flex items-center gap-3 shrink-0 min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider hidden md:inline" style={{ color: "var(--dc-text-muted)" }}>Processing Context:</span>
          
          <div className="relative flex items-center bg-[var(--dc-bg-elevated)] border rounded-md shadow-inner transition-colors hover:border-[var(--dc-accent-blue)]" style={{ borderColor: "var(--dc-border)" }}>
            <select
              value={language}
              onChange={handleLanguageChange}
              className="appearance-none bg-transparent text-[11px] font-bold uppercase tracking-wider text-[var(--dc-text-primary)] w-[140px] px-2 rounded-md py-2 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--dc-accent-blue)]"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value} className="bg-[var(--dc-bg-elevated)] text-[var(--dc-text-primary)]">
                  {lang.icon} — {lang.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[var(--dc-text-muted)]">
              <ChevronDown size={14} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
