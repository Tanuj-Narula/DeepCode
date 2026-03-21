"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSessionStore } from "@/stores/sessionStore";
import { Lightbulb, Sparkles } from "lucide-react";


/**
 * SessionSummary (D4)
 *
 * Standalone session summary card shown at the end of every Trivia session.
 * Contains: total score, time taken, questions answered, concepts mastered,
 * concepts to revisit, and a personalised tip.
 *
 * Uses Framer Motion's staggerChildren for sequential reveal animation.
 */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.1,
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
};

export default function SessionSummary() {
  const {
    questions,
    evaluations,
    totalScore,
    maxPossibleScore,
    sessionStartTime,
  } = useSessionStore();

  // Time calculation
  const [timeTakenMs, setTimeTakenMs] = useState(0);

  useEffect(() => {
    if (sessionStartTime) {
      setTimeTakenMs(Date.now() - sessionStartTime);
    }
  }, [sessionStartTime]);

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

  const timeTakenMin = Math.floor(timeTakenMs / 60000);
  const timeTakenSec = Math.floor((timeTakenMs % 60000) / 1000);
  const timeTakenStr =
    timeTakenMin > 0 ? `${timeTakenMin}m ${timeTakenSec}s` : `${timeTakenSec}s`;

  // Questions answered
  const answeredCount = Object.keys(evaluations).length;

  // Concept analysis
  const conceptResults = questions.map((q, idx) => ({
    tag: q.concept_tag,
    correct: evaluations[idx]?.correct ?? false,
    partial: evaluations[idx]?.partial ?? false,
  }));

  const mastered = conceptResults.filter((c) => c.correct);
  const toRevisit = conceptResults.filter((c) => !c.correct);

  // Personalised tip
  const tip =
    scorePercent >= 80
      ? "Excellent! You have a strong grasp of this code. Try a more complex function next."
      : scorePercent >= 50
      ? "Good progress! Switch to Understand mode and click on the lines related to your weak concepts."
      : "This function has some tricky concepts. Use the 'Walk me through this' feature in Understand mode to build your mental model.";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950"
    >

      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="p-4 text-center border-b border-zinc-800 bg-zinc-900/50"
      >
        <div className="text-2xl mb-1"><Sparkles className="inline text-dc-accent-orange" size={24} /></div>
        <h3
          className="text-base font-bold"
          style={{ color: "var(--dc-text-primary)" }}
        >
          Session Complete
        </h3>
      </motion.div>

      {/* Score */}
      <motion.div variants={itemVariants} className="p-5 text-center">
        <div className="text-4xl font-bold mb-1" style={{ color: scoreColor }}>
          {scorePercent}%
        </div>
        <div className="text-xs" style={{ color: "var(--dc-text-muted)" }}>
          {totalScore} / {maxPossibleScore} points
        </div>
      </motion.div>

      {/* Stats grid */}
      <motion.div
        variants={itemVariants}
        className="px-5 pb-4 grid grid-cols-3 gap-2"
      >
        {[
          { label: "Answered", value: `${answeredCount}/${questions.length}` },
          { label: "Time", value: timeTakenStr },
          { label: "Mastered", value: `${mastered.length}` },
        ].map((stat) => (
          <div
            key={stat.label}
            className="text-center p-2 rounded-lg"
            style={{ background: "var(--dc-bg-elevated)" }}
          >
            <div
              className="text-sm font-bold"
              style={{ color: "var(--dc-text-primary)" }}
            >
              {stat.value}
            </div>
            <div className="text-xs" style={{ color: "var(--dc-text-muted)" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Concept pills */}
      <motion.div variants={itemVariants} className="px-5 pb-4">
        <div className="flex flex-wrap gap-1.5">
          {conceptResults.map((c, idx) => (
            <span
              key={idx}
              className={`score-badge ${
                c.correct ? "green" : c.partial ? "amber" : "red"
              }`}
            >
              {c.tag.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Revisit links */}
      {toRevisit.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="px-5 pb-4"
        >
          <div className="text-xs font-semibold mb-2" style={{ color: "var(--dc-warning)" }}>
            📚 Revisit these:
          </div>
          {toRevisit.map((c, idx) => (
            <a
              key={idx}
              href={`https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(c.tag.replace(/_/g, " "))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs py-1 transition-colors"
              style={{ color: "var(--dc-text-link)" }}
            >
              ↗ {c.tag.replace(/_/g, " ")} — MDN Docs
            </a>
          ))}
        </motion.div>
      )}

      {/* Personalised tip */}
      <motion.div
        variants={itemVariants}
        className="p-4 mx-5 mb-5 rounded-lg"
        style={{
          background: "var(--dc-info-muted)",
          border: "1px solid rgba(88, 166, 255, 0.15)",
        }}
      >
        <p className="text-xs leading-relaxed" style={{ color: "var(--dc-info)" }}>
          <Lightbulb className="inline" size={16} /> {tip}
        </p>
      </motion.div>
    </motion.div>
  );
}