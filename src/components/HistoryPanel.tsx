"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, ChevronDown, ChevronRight, Sparkles, Clock, Trophy, Layers } from "lucide-react";
import { useHistoryStore } from "@/stores/historyStore";
import type { HistorySession } from "@/types/schemas";

const LANG_LABELS: Record<string, string> = {
  javascript: "JS",
  typescript: "TS",
  python: "PY",
  java: "JAVA",
  cpp: "C++",
  go: "GO",
  rust: "RS",
  csharp: "C#",
};

function formatDuration(ms: number) {
  if (ms <= 0) return "—";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function SessionCard({ session }: { session: HistorySession }) {
  const [expanded, setExpanded] = useState(false);
  const pct = session.maxPossibleScore > 0
    ? Math.round((session.totalScore / session.maxPossibleScore) * 100)
    : 0;
  const scoreColor = pct >= 80 ? "var(--dc-success)" : pct >= 50 ? "var(--dc-warning)" : "var(--dc-error)";

  return (
    <motion.div
      layout
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: "var(--dc-border)", backgroundColor: "var(--dc-bg-elevated)" }}
    >
      {/* Card Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-left hover:brightness-110 transition-all"
      >
        {/* Score ring */}
        <div
          className="w-12 h-12 shrink-0 rounded-full border-2 flex items-center justify-center text-sm font-bold"
          style={{ borderColor: scoreColor, color: scoreColor }}
        >
          {pct}%
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest"
              style={{ backgroundColor: "var(--dc-bg-tertiary)", color: "var(--dc-text-muted)" }}
            >
              {LANG_LABELS[session.language] ?? session.language}
            </span>
            {session.seedConcept && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-[#fb923c]">
                <Sparkles size={10} /> {session.seedConcept}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs" style={{ color: "var(--dc-text-secondary)" }}>
              {session.totalScore}/{session.maxPossibleScore} pts
            </span>
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--dc-text-muted)" }}>
              <Clock size={10} /> {formatDuration(session.durationMs)}
            </span>
            <span className="text-xs" style={{ color: "var(--dc-text-muted)" }}>
              {session.results.length}Q
            </span>
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--dc-text-muted)" }}>
            {formatDate(session.timestamp)}
          </p>
        </div>

        <div style={{ color: "var(--dc-text-muted)" }}>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>

      {/* Per-question Scorecard */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2 border-t" style={{ borderColor: "var(--dc-border)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-3" style={{ color: "var(--dc-text-muted)" }}>
                Scorecard
              </p>
              {session.results.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 px-3 rounded-lg"
                  style={{ backgroundColor: "var(--dc-bg-tertiary)", border: "1px solid var(--dc-border)" }}
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium capitalize" style={{ color: "var(--dc-text-primary)" }}>
                      {r.conceptTag.replace(/_/g, " ")}
                    </span>
                    <span
                      className="ml-2 text-[10px] px-1.5 py-0.5 rounded capitalize"
                      style={{
                        backgroundColor: "var(--dc-bg-elevated)",
                        color: "var(--dc-text-muted)",
                      }}
                    >
                      {r.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {r.hintsUsed > 0 && (
                      <span className="text-[10px]" style={{ color: "var(--dc-text-muted)" }}>
                        {r.hintsUsed} hint{r.hintsUsed > 1 ? "s" : ""}
                      </span>
                    )}
                    <span
                      className="text-xs font-bold"
                      style={{
                        color: r.correct ? "var(--dc-success)" : r.partial ? "var(--dc-warning)" : "var(--dc-error)",
                      }}
                    >
                      {r.correct ? "✓" : r.partial ? "~" : "✗"} {r.scoreAwarded}pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface HistoryPanelProps {
  onClose: () => void;
}

export default function HistoryPanel({ onClose }: HistoryPanelProps) {
  const { sessions, clearHistory } = useHistoryStore();

  const allTimeScore = sessions.reduce((s, h) => s + h.totalScore, 0);
  const allTimePossible = sessions.reduce((s, h) => s + h.maxPossibleScore, 0);
  const overallPct = allTimePossible > 0 ? Math.round((allTimeScore / allTimePossible) * 100) : 0;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        key="drawer"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md flex flex-col shadow-2xl"
        style={{ backgroundColor: "var(--dc-bg-primary)", borderLeft: "1px solid var(--dc-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ borderColor: "var(--dc-border)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#0D9488] flex items-center justify-center">
              <Layers size={15} color="white" />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--dc-text-primary)" }}>Session History</p>
              <p className="text-[11px]" style={{ color: "var(--dc-text-muted)" }}>
                {sessions.length} session{sessions.length !== 1 ? "s" : ""} saved
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors hover:bg-[var(--dc-bg-elevated)]" style={{ color: "var(--dc-text-muted)" }}>
            <X size={18} />
          </button>
        </div>

        {/* All-time stats bar */}
        {sessions.length > 0 && (
          <div
            className="flex items-center gap-6 px-6 py-3 border-b shrink-0"
            style={{ borderColor: "var(--dc-border)", backgroundColor: "var(--dc-bg-tertiary)" }}
          >
            <div className="flex items-center gap-2">
              <Trophy size={14} style={{ color: "var(--dc-warning)" }} />
              <span className="text-xs font-bold" style={{ color: "var(--dc-text-primary)" }}>
                {allTimeScore}<span className="font-normal text-[var(--dc-text-muted)]">/{allTimePossible} pts</span>
              </span>
            </div>
            <div className="text-xs" style={{ color: "var(--dc-text-secondary)" }}>
              Overall: <span className="font-bold" style={{ color: overallPct >= 70 ? "var(--dc-success)" : "var(--dc-warning)" }}>{overallPct}%</span>
            </div>
            <div className="text-xs" style={{ color: "var(--dc-text-muted)" }}>
              {sessions.reduce((s, h) => s + h.results.length, 0)} questions answered
            </div>
          </div>
        )}

        {/* Session list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 px-6">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, var(--dc-bg-elevated), var(--dc-bg-tertiary))", border: "1px solid var(--dc-border)" }}
              >
                <Layers size={24} style={{ color: "var(--dc-text-muted)" }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: "var(--dc-text-secondary)" }}>No sessions yet</p>
              <p className="text-xs" style={{ color: "var(--dc-text-muted)" }}>
                Complete your first trivia session and it'll show up here — even after a refresh.
              </p>
            </div>
          ) : (
            sessions.map((s) => <SessionCard key={s.id} session={s} />)
          )}
        </div>

        {/* Footer */}
        {sessions.length > 0 && (
          <div className="px-4 py-4 border-t shrink-0" style={{ borderColor: "var(--dc-border)" }}>
            <button
              onClick={() => { if (window.confirm("Clear all session history?")) clearHistory(); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-colors"
              style={{ borderColor: "var(--dc-error)", color: "var(--dc-error)", backgroundColor: "transparent" }}
            >
              <Trash2 size={13} /> Clear All History
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
