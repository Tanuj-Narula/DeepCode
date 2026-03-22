"use client";

import { useEditorStore } from "@/stores/editorStore";
import { useSessionStore } from "@/stores/sessionStore";
import type { SupportedLanguage } from "@/types/schemas";
import { motion } from "framer-motion";
import { useState } from "react";
import toast from "react-hot-toast";
import { Beaker, Lightbulb, Sparkles, ChevronDown, History } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import HistoryPanel from "./HistoryPanel";
import { useHistoryStore } from "@/stores/historyStore";

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
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [seedConcept, setSeedConcept] = useState("");
  const [seedDifficulty, setSeedDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [showHistory, setShowHistory] = useState(false);

  const { sessions } = useHistoryStore();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as SupportedLanguage;
    setLanguage(newLang);
    setCode(BOILERPLATES[newLang]);
  };

  const handleGenerateSeed = async () => {
    if (!seedConcept.trim()) {
      toast.error("Please enter a concept.");
      return;
    }
    setShowSeedModal(false);
    setGeneratingSeed(true);
    try {
      const res = await fetch("/api/generate-seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept: seedConcept.trim(), difficulty: seedDifficulty }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Generation failed");
      }

      const { code: generatedCode, language: detectedLang } = await res.json();
      setCode(generatedCode);
      if (detectedLang) setLanguage(detectedLang as SupportedLanguage);
      setSeedSession(seedConcept.trim(), true);
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } max-w-md w-full bg-[#2a1306] border border-[#ea580c]/30 shadow-[0_20px_40px_-15px_rgba(234,88,12,0.2)] rounded-xl pointer-events-auto flex p-4 backdrop-blur-md`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 text-[#fb923c] font-black text-[11px] uppercase tracking-widest mb-1.5">
                <Sparkles size={14} className="animate-pulse" /> Seed Session Active
              </div>
              <p className="text-[13px] text-[#e4e4e7] leading-relaxed">
                This workspace was generated to teach: <span className="text-white font-bold">{seedConcept.trim()}</span>. 
                It contains at least one intentional edge case.
              </p>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="ml-4 text-[#a1a1aa] hover:text-[#fb923c] transition-colors self-start p-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        ),
        { duration: 4000, position: "top-center" }
      );
      setSeedConcept("");
      setSeedDifficulty("intermediate");
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
                onClick={() => setShowSeedModal(true)}
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
        <div className="flex items-center justify-end gap-3 shrink-0 z-10">
          {/* History Button */}
          <button
            onClick={() => setShowHistory(true)}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all"
            style={{ borderColor: "var(--dc-border)", color: "var(--dc-text-secondary)", backgroundColor: "var(--dc-bg-elevated)" }}
            title="Session History"
          >
            <History size={14} />
            <span className="hidden md:inline">History</span>
            {sessions.length > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-black"
                style={{ backgroundColor: "var(--dc-accent-blue)", color: "#fff" }}
              >
                {sessions.length > 9 ? "9+" : sessions.length}
              </span>
            )}
          </button>

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
      </div>

      {/* Seed Generation Modal */}
      {showSeedModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowSeedModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border shadow-2xl p-6 flex flex-col gap-5"
            style={{
              backgroundColor: "var(--dc-bg-primary)",
              borderColor: "var(--dc-border)",
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#0D9488] flex items-center justify-center shadow-lg">
                <Sparkles size={16} color="white" />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--dc-text-primary)" }}>Generate Learning Seed</p>
                <p className="text-[11px]" style={{ color: "var(--dc-text-muted)" }}>Language is auto-detected from your concept</p>
              </div>
            </div>

            {/* Concept Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--dc-text-muted)" }}>Concept</label>
              <input
                autoFocus
                type="text"
                value={seedConcept}
                onChange={(e) => setSeedConcept(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerateSeed()}
                placeholder="e.g. goroutines, closures, memory ownership…"
                className="w-full px-3 py-2.5 rounded-lg border text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--dc-accent-blue)]"
                style={{
                  borderColor: "var(--dc-border)",
                  color: "var(--dc-text-primary)",
                  backgroundColor: "var(--dc-bg-elevated)",
                }}
              />
            </div>

            {/* Difficulty Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--dc-text-muted)" }}>Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                {(["beginner", "intermediate", "advanced"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setSeedDifficulty(d)}
                    className="py-2 rounded-lg border text-xs font-bold uppercase tracking-wide transition-all"
                    style={{
                      borderColor: seedDifficulty === d ? "var(--dc-accent-blue)" : "var(--dc-border)",
                      backgroundColor: seedDifficulty === d ? "var(--dc-accent-blue)" : "var(--dc-bg-elevated)",
                      color: seedDifficulty === d ? "#fff" : "var(--dc-text-secondary)",
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowSeedModal(false)}
                className="flex-1 py-2.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-colors"
                style={{ borderColor: "var(--dc-border)", color: "var(--dc-text-muted)", backgroundColor: "var(--dc-bg-elevated)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateSeed}
                disabled={!seedConcept.trim()}
                className="flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-md disabled:opacity-50"
                style={{ backgroundColor: "var(--dc-accent-blue)", color: "#fff" }}
              >
                Generate
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* History Drawer */}
      {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}
    </header>
  );
}
