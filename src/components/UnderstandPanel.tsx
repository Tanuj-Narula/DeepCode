"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useEditorStore } from "@/stores/editorStore";
import { useSessionStore } from "@/stores/sessionStore";
import { BookOpen, Lightbulb, Zap, Eraser, Check } from "lucide-react";


export default function UnderstandPanel() {
  const { scopedFunction, language, code, cursorLine } = useEditorStore();
  const {
    activeLineExplanation,
    activeWalkthrough,
    clickedLine,
    understandLoading,
    setActiveWalkthrough,
    setUnderstandLoading,
  } = useSessionStore();

  const [walkthroughLoading, setWalkthroughLoading] = useState(false);
  const [mutatedCode, setMutatedCode] = useState("");
  const [prediction, setPrediction] = useState("");
  const [simulating, setSimulating] = useState(false);

  const { setCode: setEditorCode } = useEditorStore();

  const handlePredictMutation = async () => {
    if (!scopedFunction || !mutatedCode || mutatedCode === scopedFunction) return;

    setSimulating(true);
    setPrediction("");

    try {
      const res = await fetch("/api/mutate-predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original: scopedFunction, modified: mutatedCode }),
      });

      if (!res.ok) throw new Error("Simulation failed");

      const data = await res.json();
      setPrediction(data.explanation);
    } catch {
      toast.error("Failed to simulate code changes");
    } finally {
      setSimulating(false);
    }
  };

  const handleApplyMutation = () => {
    if (!mutatedCode) return;
    setEditorCode(mutatedCode);
    toast.success("Changes applied to editor!");
    setMutatedCode("");
    setPrediction("");
  };

  // Fetch walkthrough
  const handleWalkthrough = useCallback(async () => {
    if (!scopedFunction) {
      toast.error("Move your cursor inside a function first");
      return;
    }

    setWalkthroughLoading(true);
    setUnderstandLoading(true);

    try {
      const res = await fetch("/api/walkthrough", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: scopedFunction, language }),
      });

      if (!res.ok) throw new Error("Walkthrough failed");

      const data = await res.json();
      setActiveWalkthrough(data);
    } catch {
      toast.error("Failed to generate walkthrough");
    } finally {
      setWalkthroughLoading(false);
      setUnderstandLoading(false);
    }
  }, [scopedFunction, language, setActiveWalkthrough, setUnderstandLoading]);

  // Get the content of the clicked line
  // Get the neighborhood context of the clicked line
  const getContextLines = () => {
    if (!clickedLine) return [];
    const lines = code.split("\n");
    const start = Math.max(0, clickedLine - 3); // Showing 2 lines above
    const end = Math.min(lines.length, clickedLine + 2); // Showing 2 lines below
    
    return lines.slice(start, end).map((content, idx) => ({
      lineNumber: start + idx + 1,
      content,
      isTarget: start + idx + 1 === clickedLine
    }));
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Panel header */}
      <div
        className="px-4 py-3 flex items-center justify-between  "
        style={{
          background: "var(--dc-bg-tertiary)",
          borderBottom: "1px solid var(--dc-border)",
        }}
      >
        <div>
          <h3
            className="text-sm font-semibold"
            style={{ color: "var(--dc-text-primary)" }}
          >
            <Lightbulb className="inline" size={16} /> Understand Mode
          </h3>
          <p className="text-xs" style={{ color: "var(--dc-text-muted)" }}>
            Click any line to understand it • No judgments
          </p>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Action buttons */}
        <div className="space-y-2">
          <button
            id="walkthrough-btn"
            onClick={handleWalkthrough}
            disabled={walkthroughLoading || !scopedFunction}
            className="dc-btn dc-btn-secondary w-full justify-start text-sm"
          >
            {walkthroughLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Walking through...
              </span>
            ) : (
              <><BookOpen className="inline" size={16} /> Walk me through this function</>
            )}
          </button>
        </div>

        {/* Loading state */}
        {understandLoading && !walkthroughLoading && (
          <div className="space-y-3">
            <div className="loading-shimmer h-4 rounded-lg w-3/4" />
            <div className="loading-shimmer h-4 rounded-lg w-full" />
            <div className="loading-shimmer h-4 rounded-lg w-5/6" />
            <div className="loading-shimmer h-4 rounded-lg w-2/3" />
          </div>
        )}

        {/* Line Explanation (C1) */}
        <AnimatePresence mode="wait">
          {activeLineExplanation && clickedLine && (
            <motion.div
              key={`line-${clickedLine}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {/* Line reference / Context Neighborhood */}
              <div
                className="rounded-lg border overflow-hidden"
                style={{
                  background: "var(--dc-bg-elevated)",
                  borderColor: "var(--dc-border)",
                }}
              >
                <div className="px-3 py-1.5 flex items-center gap-2 border-b" style={{ borderColor: "var(--dc-border-light)", background: "rgba(255,255,255,0.02)" }}>
                   <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Neighborhood Context</span>
                </div>
                <div className="p-2 font-mono text-[11px] leading-relaxed">
                  {getContextLines().map((line) => (
                    <div 
                      key={line.lineNumber} 
                      className={`flex gap-3 px-2 py-0.5 rounded ${line.isTarget ? 'bg-dc-accent-blue/10 border-l-2 border-dc-accent-blue' : ''}`}
                    >
                      <span className="w-4 text-right opacity-30 select-none">{line.lineNumber}</span>
                      <span className={`${line.isTarget ? 'text-dc-text-primary font-bold' : 'text-dc-text-muted'}`}>
                        {line.content || " "}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* What it does */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl p-4"
                style={{
                  background: "var(--dc-bg-tertiary)",
                  border: "1px solid var(--dc-border)",
                  borderLeft: "3px solid var(--dc-accent-blue)",
                }}
              >
                <h4
                  className="text-xs font-semibold mb-2 uppercase tracking-wider"
                  style={{ color: "var(--dc-accent-blue)" }}
                >
                  What it does
                </h4>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--dc-text-primary)" }}
                >
                  {activeLineExplanation.what_it_does}
                </p>
              </motion.div>

              {/* Why this way */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl p-4"
                style={{
                  background: "var(--dc-bg-tertiary)",
                  border: "1px solid var(--dc-border)",
                  borderLeft: "3px solid var(--dc-accent-purple)",
                }}
              >
                <h4
                  className="text-xs font-semibold mb-2 uppercase tracking-wider"
                  style={{ color: "var(--dc-accent-purple)" }}
                >
                  Why this way
                </h4>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--dc-text-primary)" }}
                >
                  {activeLineExplanation.why_this_way}
                </p>
              </motion.div>

              {/* What breaks if removed */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl p-4"
                style={{
                  background: "var(--dc-bg-tertiary)",
                  border: "1px solid var(--dc-border)",
                  borderLeft: "3px solid var(--dc-error)",
                }}
              >
                <h4
                  className="text-xs font-semibold mb-2 uppercase tracking-wider"
                  style={{ color: "var(--dc-error)" }}
                >
                  What breaks if removed
                </h4>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--dc-text-primary)" }}
                >
                  {activeLineExplanation.what_breaks_if_removed}
                </p>
              </motion.div>
              {/* Mutate & Observe (Feature 3) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-8 pt-6 border-t border-zinc-800"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-black uppercase tracking-widest text-[#ea580c] flex items-center gap-2">
                    <Zap size={16} /> Mutate & Observe
                  </h4>
                  <span className="text-[10px] font-bold text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 font-mono">
                    SOCRATIC_EXP
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Mutation Experiment:</label>
                    <textarea
                      value={mutatedCode || scopedFunction || ""}
                      onChange={(e) => setMutatedCode(e.target.value)}
                      placeholder="Experiment by changing the function logic..."
                      className="w-full h-40 p-4 bg-[#09090b] text-zinc-300 font-mono text-xs rounded-xl border border-zinc-800 focus:border-zinc-700 focus:outline-none resize-none transition-all shadow-inner"
                    />
                    <button
                      onClick={handlePredictMutation}
                      disabled={simulating || !mutatedCode || mutatedCode === scopedFunction}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-50 hover:bg-white text-zinc-950 rounded-md font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 active:scale-[0.98]"
                    >
                      {simulating ? (
                        <span className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                      ) : (
                        <Zap size={14} />
                      )}
                      Predict Behavior Change
                    </button>
                  </div>

                  <AnimatePresence>
                    {prediction && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-orange-600/5 border border-orange-500/20 space-y-4 shadow-sm"
                      >
                        <div>
                          <h5 className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                             Analysis Outcome
                          </h5>
                          <p className="text-[13px] text-zinc-200 leading-relaxed font-medium">
                            {prediction}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <button
                            onClick={handleApplyMutation}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[10px] font-black uppercase tracking-[0.15em] transition-colors"
                          >
                            <Check size={12} /> Apply Mutation
                          </button>
                          <button
                            onClick={() => { setPrediction(""); setMutatedCode(""); }}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-black uppercase tracking-[0.15em] transition-colors"
                          >
                            <Eraser size={12} /> Discard
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Function Walkthrough (C2) */}
        <AnimatePresence>
          {activeWalkthrough && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-3"
            >
              <div
                className="rounded-2xl p-4"
                style={{
                  background: "var(--dc-bg-tertiary)",
                  border: "1px solid var(--dc-border)",
                }}
              >
                <h4
                  className="text-sm font-bold mb-3"
                  style={{ color: "var(--dc-text-primary)" }}
                >
                  <BookOpen className="inline" size={16} /> Function Walkthrough
                </h4>

                {/* Purpose */}
                <div className="mb-4">
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--dc-accent-teal)" }}
                  >
                    Purpose
                  </span>
                  <p
                    className="text-sm mt-1"
                    style={{ color: "var(--dc-text-primary)" }}
                  >
                    {activeWalkthrough.purpose}
                  </p>
                </div>

                {/* Inputs */}
                <div className="mb-4">
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--dc-accent-blue)" }}
                  >
                    Inputs
                  </span>
                  <p
                    className="text-sm mt-1"
                    style={{ color: "var(--dc-text-primary)" }}
                  >
                    {activeWalkthrough.inputs}
                  </p>
                </div>

                {/* Steps */}
                <div className="mb-4">
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--dc-accent-purple)" }}
                  >
                    Step-by-Step
                  </span>
                  <div className="space-y-2 mt-2">
                    {activeWalkthrough.steps.map((step, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex gap-3 p-2 rounded-lg"
                        style={{
                          background: "var(--dc-bg-elevated)",
                        }}
                      >
                        <span
                          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{
                            background: "var(--dc-accent-purple)",
                            color: "#fff",
                          }}
                        >
                          {step.step_number}
                        </span>
                        <div>
                          <p
                            className="text-sm"
                            style={{ color: "var(--dc-text-primary)" }}
                          >
                            {step.description}
                          </p>
                          {step.code_reference && (
                            <code
                              className="text-xs mt-1 block"
                              style={{
                                color: "var(--dc-accent-teal)",
                                fontFamily: "var(--font-mono)",
                              }}
                            >
                              {step.code_reference}
                            </code>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Output */}
                <div className="mb-4">
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--dc-success)" }}
                  >
                    Output
                  </span>
                  <p
                    className="text-sm mt-1"
                    style={{ color: "var(--dc-text-primary)" }}
                  >
                    {activeWalkthrough.output}
                  </p>
                </div>

                {/* Edge Cases */}
                {activeWalkthrough.edge_cases.length > 0 && (
                  <div>
                    <span
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "var(--dc-warning)" }}
                    >
                      ⚠️ Edge Cases
                    </span>
                    <ul className="mt-2 space-y-1">
                      {activeWalkthrough.edge_cases.map((edge, idx) => (
                        <li
                          key={idx}
                          className="text-sm flex items-start gap-2"
                          style={{ color: "var(--dc-text-secondary)" }}
                        >
                          <span style={{ color: "var(--dc-warning)" }}>•</span>
                          {edge}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!activeLineExplanation && !activeWalkthrough && !understandLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
              style={{
                background:
                  "linear-gradient(135deg, var(--dc-accent-purple), var(--dc-accent-teal))",
                boxShadow: "var(--dc-shadow-glow-purple)",
              }}
            >
              <Lightbulb className="inline" size={16} />
            </div>
            <h3
              className="text-base font-bold mb-2"
              style={{ color: "var(--dc-text-primary)" }}
            >
              Safe Space to Explore
            </h3>
            <p
              className="text-sm max-w-xs"
              style={{ color: "var(--dc-text-secondary)" }}
            >
              Click any line in the editor to understand it. No scores, no
              judgments — just learning.
            </p>
            <div
              className="mt-4 p-3 rounded-lg text-xs"
              style={{
                background: "var(--dc-bg-tertiary)",
                border: "1px solid var(--dc-border)",
                color: "var(--dc-text-muted)",
              }}
            >
              <div className="flex items-center gap-2">
                <span style={{ color: "var(--dc-warning)" }}>→</span>
                Click a line in the editor
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span style={{ color: "var(--dc-accent-purple)" }}>→</span>
                Or use &quot;Walk me through this&quot; above
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}