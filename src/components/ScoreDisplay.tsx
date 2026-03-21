"use client";

import { useSessionStore } from "@/stores/sessionStore";

/**
 * ScoreDisplay (D1)
 *
 * Displays the understanding score as a percentage with colour coding:
 * - 80%+  → Green
 * - 50–79% → Amber
 * - Below 50% → Red
 *
 * Formula: score = (first_try_correct × 10) + (correct_after_hint × 5) + (correct_after_explanation × 2)
 */
export default function ScoreDisplay() {
  const { totalScore, maxPossibleScore, questions } = useSessionStore();

  if (questions.length === 0) return null;

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

  const scoreLabel =
    scorePercent >= 80 ? "Strong" : scorePercent >= 50 ? "Developing" : "Needs Work";

  return (
    <div
      className="flex items-center gap-3 px-4 py-2 rounded-xl"
      style={{
        background: "var(--dc-bg-tertiary)",
        border: "1px solid var(--dc-border)",
      }}
    >
      {/* Score circle */}
      <div
        className="relative w-12 h-12 flex items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(${scoreColor} ${scorePercent * 3.6}deg, var(--dc-bg-elevated) 0deg)`,
        }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: "var(--dc-bg-tertiary)", color: scoreColor }}
        >
          {scorePercent}%
        </div>
      </div>

      {/* Score info */}
      <div>
        <div className="text-sm font-semibold" style={{ color: scoreColor }}>
          {scoreLabel}
        </div>
        <div className="text-xs" style={{ color: "var(--dc-text-muted)" }}>
          {totalScore} / {maxPossibleScore} pts
        </div>
      </div>
    </div>
  );
}
