"use client";

import { useEditorStore } from "@/stores/editorStore";
import { useSessionStore } from "@/stores/sessionStore";
import type { SupportedLanguage } from "@/types/schemas";
import { motion } from "framer-motion";
import { useState } from "react";
import toast from "react-hot-toast";
import { Beaker, Lightbulb, Sparkles } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const LANGUAGES: { value: SupportedLanguage; label: string; icon: string }[] = [
  { value: "javascript", label: "JavaScript", icon: "JS" },
  { value: "typescript", label: "TypeScript", icon: "TS" },
  { value: "python", label: "Python", icon: "PY" },
];

export default function Header() {
  const { language, setCode, setLanguage } = useEditorStore();
  const { mode, setMode, totalScore, maxPossibleScore, questions, setSeedSession } =
    useSessionStore();

  const [generatingSeed, setGeneratingSeed] = useState(false);

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
        className="relative flex items-center justify-between px-6 md:px-14 py-4 border-b" 
        style={{ backgroundColor: "var(--dc-bg-primary)", borderColor: "var(--dc-border)" }}
      >
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center justify-center w-10 h-10 rounded-md shadow-sm font-black text-[14px] text-white tracking-tighter" style={{ backgroundColor: "var(--dc-accent-blue)" }}>
            DC
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-black tracking-tight leading-tight" style={{ color: "var(--dc-text-primary)" }}>
              DEEPCODE <span className="font-normal" style={{ color: "var(--dc-text-muted)" }}>AI</span>
            </h1>
            <p className="text-xs font-medium font-mono uppercase tracking-widest mt-0.5" style={{ color: "var(--dc-text-muted)" }}>
              Production Code Analysis
            </p>
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
        className="flex items-center justify-between px-8 md:px-14 min-h-[56px]" 
        style={{ backgroundColor: "var(--dc-bg-tertiary)" }}
      >
        
        {/* Massive Workspace Tabs */}
        <div className="flex h-full items-end gap-2 pt-2">
          <button
            id="mode-trivia-btn"
            onClick={() => setMode("trivia")}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold transition-all`}
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
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold transition-all`}
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
          <div className="flex items-center gap-1 p-1 rounded-md border shadow-inner overflow-x-auto overflow-y-hidden max-w-[180px] sm:max-w-full scrollbar-none" style={{ backgroundColor: "var(--dc-bg-primary)", borderColor: "var(--dc-border)" }}>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.value}
                id={`lang-${lang.value}-btn`}
                onClick={() => setLanguage(lang.value)}
                className={`relative whitespace-nowrap shrink-0 px-4 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-colors focus:outline-none flex items-center gap-2`}
                style={{ color: language === lang.value ? "var(--dc-bg-primary)" : "var(--dc-text-primary)" }}
                title={lang.label}
              >
                {language === lang.value && (
                  <motion.div
                    layoutId="active-lang"
                    className="absolute inset-0 rounded-sm shadow-sm z-0"
                    style={{ backgroundColor: "var(--dc-text-primary)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">{lang.icon} {lang.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
