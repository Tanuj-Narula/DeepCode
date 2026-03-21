"use client";

import { useSessionStore } from "@/stores/sessionStore";

/**
 * ConceptBreakdown (D2)
 *
 * Aggregates scores per concept tag and displays:
 * Strong: closures (88%) · Weak: async/await (34%)
 * Colour coded: green (strong) / amber (developing) / red (weak)
 */
export default function ConceptBreakdown() {
  const { questions, evaluations } = useSessionStore();

  if (questions.length === 0) return null;

  const conceptResults = questions.map((q, idx) => ({
    tag: q.concept_tag,
    difficulty: q.difficulty,
    correct: evaluations[idx]?.correct ?? false,
    partial: evaluations[idx]?.partial ?? false,
    scoreAwarded: evaluations[idx]?.score_awarded ?? 0,
  }));

  // Group by concept tag and calculate aggregate score
  const conceptMap = new Map<
    string,
    { total: number; earned: number; count: number }
  >();

  for (const result of conceptResults) {
    const existing = conceptMap.get(result.tag) ?? {
      total: 0,
      earned: 0,
      count: 0,
    };
    conceptMap.set(result.tag, {
      total: existing.total + 10,
      earned: existing.earned + result.scoreAwarded,
      count: existing.count + 1,
    });
  }

  const concepts = Array.from(conceptMap.entries()).map(([tag, data]) => ({
    tag,
    percentage: Math.round((data.earned / data.total) * 100),
    count: data.count,
  }));

  const getStatusColor = (pct: number) =>
    pct >= 80
      ? "var(--dc-success)"
      : pct >= 50
      ? "var(--dc-warning)"
      : "var(--dc-error)";

  const getStatusBg = (pct: number) =>
    pct >= 80
      ? "var(--dc-success-muted)"
      : pct >= 50
      ? "var(--dc-warning-muted)"
      : "var(--dc-error-muted)";

  const getStatusLabel = (pct: number) =>
    pct >= 80 ? "Strong" : pct >= 50 ? "Developing" : "Weak";

  return (
    <div className="space-y-2">
      <h4
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: "var(--dc-text-muted)" }}
      >
        Concepts
      </h4>
      {concepts.map((c) => (
        <div
          key={c.tag}
          className="flex items-center justify-between py-2 px-3 rounded-lg"
          style={{
            background: "var(--dc-bg-elevated)",
            border: "1px solid var(--dc-border-light)",
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: getStatusColor(c.percentage) }}
            />
            <span
              className="text-sm font-medium"
              style={{ color: "var(--dc-text-primary)" }}
            >
              {c.tag.replace(/_/g, " ")}
            </span>
          </div>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: getStatusBg(c.percentage),
              color: getStatusColor(c.percentage),
            }}
          >
            {getStatusLabel(c.percentage)} ({c.percentage}%)
          </span>
        </div>
      ))}
    </div>
  );
}
