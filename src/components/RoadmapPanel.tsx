"use client";

import { useSessionStore } from "@/stores/sessionStore";
import { useEditorStore } from "@/stores/editorStore";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import toast from "react-hot-toast";
import { 
  ChevronDown, 
  ChevronRight, 
  Play, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Map,
  Sparkles
} from "lucide-react";

export default function RoadmapPanel() {
  const { roadmap, roadmapProgress, setSeedSession, setMode, setRoadmap } = useSessionStore();
  const { setCode } = useEditorStore();
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1);
  const [generating, setGenerating] = useState(false);

  const handleTestNow = async (concept: string) => {
    setGenerating(true);
    toast.loading(`Generating project for ${concept}...`, { id: "seed-gen" });
    
    try {
      const res = await fetch("/api/generate-seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept, difficulty: "intermediate" }),
      });

      if (!res.ok) throw new Error("Generation failed");

      const { code } = await res.json();
      setCode(code);
      setSeedSession(concept, true);
      setMode("trivia");
      toast.success(`Started lesson for ${concept}`, { id: "seed-gen" });
    } catch {
      toast.error("Failed to generate seed project", { id: "seed-gen" });
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateInitial = async () => {
    setGenerating(true);
    toast.loading("Analyzing session data and building roadmap...", { id: "roadmap-gen" });
    try {
      // Mocking some score data for generation if real scores are missing
      const scores = { "async_await": 45, "closures": 85, "error_handling": 60 };
      const res = await fetch("/api/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRoadmap(data);
      toast.success("Your learning roadmap is ready!", { id: "roadmap-gen" });
    } catch {
      toast.error("Roadmap generation failed", { id: "roadmap-gen" });
    } finally {
      setGenerating(false);
    }
  };

  if (!roadmap) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-12 py-16 text-center" style={{ backgroundColor: "var(--dc-bg-secondary)" }}>
        <div className="w-16 h-16 rounded-2xl border flex items-center justify-center mb-6 shadow-sm" style={{ backgroundColor: "var(--dc-bg-elevated)", borderColor: "var(--dc-border)" }}>
          <Map size={32} style={{ color: "var(--dc-text-muted)" }} />
        </div>
        <h3 className="text-2xl font-bold mb-3 underline decoration-[#ea580c] underline-offset-8" style={{ color: "var(--dc-text-primary)" }}>
          Learning Roadmap
        </h3>
        <p className="text-sm max-w-[280px] leading-relaxed mb-8" style={{ color: "var(--dc-text-secondary)" }}>
          Complete your first trivia session to unlock a personalized 4-week path to mastery.
        </p>
        <button 
          onClick={handleGenerateInitial}
          disabled={generating}
          className="mt-6 px-8 py-3 bg-foreground hover:opacity-90 text-background rounded-md font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 shadow-md hover:shadow-lg"
          style={{ backgroundColor: "var(--dc-text-primary)", color: "var(--dc-bg-primary)" }}
        >
          {generating ? "Calibrating..." : "Generate My Roadmap"}
        </button>
      </div>
    );
  }

  // Calculate overall progress
  const totalMilestones = roadmap.weeks.reduce((acc, w) => acc + w.milestones.length, 0);
  const completedMilestones = Object.values(roadmapProgress).filter(s => s === "mastered").length;
  const progressPercent = Math.round((completedMilestones / totalMilestones) * 100);

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ backgroundColor: "var(--dc-bg-primary)" }}>
      {/* Header with overall progress */}
      <div className="p-6 border-b" style={{ backgroundColor: "var(--dc-bg-secondary)", borderColor: "var(--dc-border)" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2" style={{ color: "var(--dc-text-muted)" }}>
            <Sparkles size={16} className="text-[#ea580c]" /> Mastery Progress
          </h3>
          <span className="text-xs font-mono font-bold px-2 py-1 rounded border" style={{ backgroundColor: "var(--dc-bg-primary)", borderColor: "var(--dc-border)", color: "var(--dc-text-secondary)" }}>
            {completedMilestones}/{totalMilestones} Units
          </span>
        </div>
        
        <div className="w-full h-2 rounded-full overflow-hidden border mb-2" style={{ backgroundColor: "var(--dc-bg-primary)", borderColor: "var(--dc-border)" }}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            className="h-full bg-[#ea580c]"
          />
        </div>
        <p className="text-[10px] uppercase font-bold tracking-tighter" style={{ color: "var(--dc-text-muted)" }}>
          Global Expertise Level: <span style={{ color: "var(--dc-text-primary)" }}>{progressPercent}%</span>
        </p>
      </div>

      {/* Week Cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {roadmap.weeks.map((week) => (
          <div 
            key={week.weekNumber}
            className="rounded-xl border transition-all"
            style={{
              backgroundColor: expandedWeek === week.weekNumber ? "var(--dc-bg-tertiary)" : "transparent",
              borderColor: expandedWeek === week.weekNumber ? "var(--dc-border-accent)" : "var(--dc-border)"
            }}
          >
            <button 
              onClick={() => setExpandedWeek(expandedWeek === week.weekNumber ? null : week.weekNumber)}
              className="w-full p-4 flex items-center justify-between group"
            >
              <div className="flex flex-col items-start text-left">
                <span className="text-[10px] font-black text-[#ea580c] uppercase tracking-[0.2em] mb-1">
                  WEEK 0{week.weekNumber}
                </span>
                <span className="text-sm font-bold transition-colors" style={{ color: "var(--dc-text-primary)" }}>
                  {week.theme}
                </span>
              </div>
              {expandedWeek === week.weekNumber ? <ChevronDown size={20} style={{ color: "var(--dc-text-muted)" }} /> : <ChevronRight size={20} style={{ color: "var(--dc-text-muted)" }} />}
            </button>

            <AnimatePresence>
              {expandedWeek === week.weekNumber && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-zinc-800/50"
                >
                  <div className="p-4 space-y-3" style={{ borderTop: "1px solid var(--dc-border)" }}>
                    {week.milestones.map((ms, idx) => {
                      const status = roadmapProgress[ms.concept] || "not_started";
                      return (
                        <div 
                          key={idx}
                          className="p-3 rounded-lg border flex items-start gap-4 shadow-sm"
                          style={{ backgroundColor: "var(--dc-bg-primary)", borderColor: "var(--dc-border)" }}
                        >
                          <div className="mt-1">
                            {status === "mastered" ? (
                              <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                <CheckCircle2 size={12} className="text-emerald-500" />
                              </div>
                            ) : status === "attempted" ? (
                              <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                <Clock size={12} className="text-amber-500" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full flex items-center justify-center border" style={{ backgroundColor: "var(--dc-bg-tertiary)", borderColor: "var(--dc-border)" }}>
                                <AlertCircle size={12} style={{ color: "var(--dc-text-muted)" }} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold mb-1 pointer-events-none capitalize" style={{ color: "var(--dc-text-primary)" }}>
                              {ms.concept.replace(/_/g, " ")}
                            </h4>
                            <p className="text-[11px] leading-normal mb-3" style={{ color: "var(--dc-text-muted)" }}>
                              {ms.reason}
                            </p>
                            <button 
                              onClick={() => handleTestNow(ms.concept)}
                              disabled={generating}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors border group/btn active:translate-y-px hover:opacity-80 shadow-sm"
                              style={{ backgroundColor: "var(--dc-bg-elevated)", borderColor: "var(--dc-border)", color: "var(--dc-text-primary)" }}
                            >
                              <Play size={10} className="fill-current group-hover/btn:text-[#ea580c] transition-colors" /> Practice Session
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
