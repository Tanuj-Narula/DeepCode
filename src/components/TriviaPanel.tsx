"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useEditorStore } from "@/stores/editorStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useHistoryStore } from "@/stores/historyStore";
import type { Evaluation, HintProgress } from "@/types/schemas";
import { RefreshCw, Target, BookOpen, HelpCircle, Lightbulb, XCircle, Swords, CheckCircle2, Sparkles, Info, X } from "lucide-react";


export default function TriviaPanel() {
  const { scopedFunction, language } = useEditorStore();
  const {
    questions,
    currentQuestionIndex,
    userAnswers,
    evaluations,
    hintProgress,
    retryResults,
    isSeedSession,
    seedConcept,
    triviaComplete,
    triviaLoading,
    setQuestions,
    totalScore,
    maxPossibleScore,
    setCurrentQuestionIndex,
    setUserAnswer,
    setEvaluation,
    addHint,
    setRetryResult,
    setTriviaComplete,
    setTriviaLoading,
    updateScore,
    wrongAttempts,
    setWrongAttempt,
    addSessionResult,
    setMode,
    sessionResults,
  } = useSessionStore();

  const [answerInput, setAnswerInput] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [evaluatingReadiness, setEvaluatingReadiness] = useState(false);
  const [completeTimeMs, setCompleteTimeMs] = useState<number | null>(null);

  // Track session duration when it finishes to avoid impure render calls
  useEffect(() => {
    if (triviaComplete && !completeTimeMs) {
      const sessionStart = useSessionStore.getState().sessionStartTime;
      if (sessionStart) {
        setCompleteTimeMs(Date.now() - sessionStart);
      }
    } else if (!triviaComplete && completeTimeMs !== null) {
      setCompleteTimeMs(null);
    }
  }, [triviaComplete, completeTimeMs]);

  // Generate questions
  const handleGenerateQuestions = useCallback(async () => {
    if (!scopedFunction) {
      toast.error("Move your cursor inside a function first");
      return;
    }

    setTriviaLoading(true);

    try {
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: scopedFunction, language }),
      });

      if (!res.ok) throw new Error("Failed to generate questions");

      const data = await res.json();
      setQuestions(data.questions);
      toast.success("3 questions generated — let's go!");
    } catch {
      toast.error("Failed to generate questions. Check your API key.");
    } finally {
      setTriviaLoading(false);
    }
  }, [scopedFunction, language, setQuestions, setTriviaLoading]);

  // Request hint
  const handleRequestHint = useCallback(async (levelOverride?: 1 | 2 | 3) => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;

    const currentHintProgress = hintProgress[currentQuestionIndex];
    const nextLevel = (levelOverride || (currentHintProgress?.currentLevel ?? 0) + 1) as 1 | 2 | 3;

    if (nextLevel > 3) return;

    setHintLoading(true);

    try {
      const previousHintTexts =
        currentHintProgress?.hints.map((h) => h.hint_text) ?? [];

      const res = await fetch("/api/generate-hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQ.question,
          code: scopedFunction,
          userAnswer: userAnswers[currentQuestionIndex] ?? answerInput ?? "",
          hintLevel: nextLevel,
          previousHints: previousHintTexts,
        }),
      });

      if (!res.ok) throw new Error("Hint generation failed");

      const hint = await res.json();

      const updatedHints: HintProgress = {
        currentLevel: nextLevel,
        hints: [...(currentHintProgress?.hints ?? []), hint],
      };

      addHint(currentQuestionIndex, updatedHints);
    } catch {
      toast.error("Failed to generate hint");
    } finally {
      setHintLoading(false);
    }
  }, [
    questions,
    currentQuestionIndex,
    hintProgress,
    scopedFunction,
    userAnswers,
    answerInput,
    addHint,
  ]);

  // Submit answer
  const handleSubmitAnswer = useCallback(async () => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ || !answerInput.trim()) return;

    setEvaluating(true);

    try {
      const res = await fetch("/api/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQ.question,
          code: scopedFunction,
          expectedKeywords: currentQ.expected_keywords,
          userAnswer: answerInput,
        }),
      });

      if (!res.ok) throw new Error("Evaluation failed");

      const evaluation: Evaluation = await res.json();
      const attempts = (wrongAttempts[currentQuestionIndex] ?? 0) + 1;

      if (evaluation.correct) {
        setUserAnswer(currentQuestionIndex, answerInput);
        setEvaluation(currentQuestionIndex, evaluation);
        updateScore(10); // Standard 10 for correct
        toast.success(`Correct! +10 pts`);
        setAnswerInput("");
      } else {
        // Wrong or Partial
        if (attempts < 3) {
          setWrongAttempt(currentQuestionIndex, attempts);
          toast.error(evaluation.partial ? "Partial answer. Hint incoming!" : "Incorrect. Here's a hint!");
          
          // Auto-request hint
          await handleRequestHint(attempts as 1 | 2 | 3);
          setAnswerInput(""); // Clear for retry
        } else {
          // 3rd failed attempt
          setWrongAttempt(currentQuestionIndex, attempts);
          setUserAnswer(currentQuestionIndex, answerInput);
          evaluation.score_awarded = 0; // Force 0 on 3rd failure
          setEvaluation(currentQuestionIndex, evaluation);
          updateScore(0);
          
          await handleRequestHint(3); // Show final hint/explanation
          toast("Moved to next question (0 pts)", { icon: <BookOpen size={16} /> });
          setAnswerInput("");
        }
      }
    } catch {
      toast.error("Evaluation failed — try again");
    } finally {
      setEvaluating(false);
    }
  }, [
    questions,
    currentQuestionIndex,
    answerInput,
    scopedFunction,
    wrongAttempts,
    setWrongAttempt,
    setUserAnswer,
    setEvaluation,
    updateScore,
    handleRequestHint,
  ]);

  // Skip question
  const handleSkipQuestion = useCallback(async () => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;

    setEvaluating(true);
    try {
      setWrongAttempt(currentQuestionIndex, 3);
      setUserAnswer(currentQuestionIndex, "Skipped");
      const skipEval: Evaluation = {
        correct: false,
        partial: false,
        score_awarded: 0,
        feedback: "Question skipped. Here is the full explanation so you can learn from it.",
        concept_gap: currentQ.concept_tag,
      };
      setEvaluation(currentQuestionIndex, skipEval);
      updateScore(0);
      
      await handleRequestHint(3);
      toast("Question skipped (0 pts)", { icon: <XCircle size={16} /> });
      setAnswerInput("");
    } catch {
      toast.error("Failed to skip question");
    } finally {
      setEvaluating(false);
    }
  }, [
    questions,
    currentQuestionIndex,
    setWrongAttempt,
    setUserAnswer,
    setEvaluation,
    updateScore,
    handleRequestHint,
  ]);

  // Move to next question or finish
  const handleNext = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setAnswerInput("");
    } else {
      // Session complete
      setTriviaComplete(true);

      // Persist to LocalStorage history
      const sessionState = useSessionStore.getState();
      useHistoryStore.getState().addSession({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        durationMs: sessionState.sessionStartTime ? Date.now() - sessionState.sessionStartTime : 0,
        language,
        seedConcept: sessionState.seedConcept,
        totalScore,
        maxPossibleScore,
        results: questions.map((q, idx) => ({
          conceptTag: q.concept_tag,
          difficulty: q.difficulty,
          correct: evaluations[idx]?.correct ?? false,
          partial: evaluations[idx]?.partial ?? false,
          scoreAwarded: evaluations[idx]?.score_awarded ?? 0,
          hintsUsed: hintProgress[idx]?.hints?.length ?? 0,
        })),
      });

      toast.success("Session complete! Check your results.");
    }
  }, [
    currentQuestionIndex,
    questions,
    evaluations,
    hintProgress,
    language,
    totalScore,
    maxPossibleScore,
    setCurrentQuestionIndex,
    setTriviaComplete,
  ]);

  const currentQuestion = questions[currentQuestionIndex];
  const currentEvaluation = evaluations[currentQuestionIndex];
  const currentHints = hintProgress[currentQuestionIndex];
  
  const questionFinished = currentEvaluation?.correct || (wrongAttempts[currentQuestionIndex] ?? 0) >= 3;


  // ─── Empty State ───
  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
            style={{
              background:
                "linear-gradient(135deg, var(--dc-accent-blue), var(--dc-accent-purple))",
              boxShadow: "var(--dc-shadow-glow-blue)",
            }}
          >
            <Swords className="inline" size={18} />
          </div>
          <h2
            className="text-xl font-bold mb-2"
            style={{ color: "var(--dc-text-primary)" }}
          >
            Trivia Mode
          </h2>
          <p
            className="text-sm mb-6 max-w-xs"
            style={{ color: "var(--dc-text-secondary)" }}
          >
            Paste code in the editor, place your cursor inside a function, and
            prove you understand it.
          </p>
          <button
            id="test-me-btn"
            onClick={handleGenerateQuestions}
            disabled={triviaLoading || !scopedFunction}
            className="dc-btn dc-btn-primary text-base px-8 py-3"
          >
            {triviaLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </span>
            ) : (
              <span className="flex items-center gap-2"><Target className="inline" size={16} /> Test Me</span>
            )}
          </button>
          {!scopedFunction && (
            <p className="text-xs mt-3" style={{ color: "var(--dc-text-muted)" }}>
              Place your cursor inside a function first
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  // ─── Session Complete ───
  if (triviaComplete) {
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

    // Calculate time taken
    const timeTakenMs = completeTimeMs || 0;
    const timeTakenMin = Math.floor(timeTakenMs / 60000);
    const timeTakenSec = Math.floor((timeTakenMs % 60000) / 1000);
    const timeTakenStr = timeTakenMin > 0 ? `${timeTakenMin}m ${timeTakenSec}s` : `${timeTakenSec}s`;

    // Count answered questions
    const answeredCount = Object.keys(evaluations).length;

    // Get concept results
    const conceptResults = questions.map((q, idx) => ({
      tag: q.concept_tag,
      correct: evaluations[idx]?.correct ?? false,
      partial: evaluations[idx]?.partial ?? false,
    }));

    const strongConcepts = conceptResults.filter((c) => c.correct);
    const weakConcepts = conceptResults.filter((c) => !c.correct);



    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col p-6 h-full overflow-y-auto"
      >
        <div
          className="rounded-2xl p-6 mb-4"
          style={{
            background: "var(--dc-bg-tertiary)",
            border: "1px solid var(--dc-border)",
          }}
        >
          <h2
            className="text-lg font-bold mb-1"
            style={{ color: "var(--dc-text-primary)" }}
          >
            Session Complete <Sparkles className="inline text-dc-accent-orange" size={24} />
          </h2>
          <p className="text-sm" style={{ color: "var(--dc-text-secondary)" }}>
            Here&apos;s how you did
          </p>

          {/* Score Display */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="text-center my-6"
          >
            <div
              className="text-5xl font-bold mb-1"
              style={{ color: scoreColor }}
            >
              {scorePercent}%
            </div>
            <div
              className="text-sm"
              style={{ color: "var(--dc-text-secondary)" }}
            >
              {totalScore} / {maxPossibleScore} points
            </div>
          </motion.div>

          {/* Session Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="grid grid-cols-3 gap-3 mb-5"
          >
            <div
              className="text-center p-3 rounded-lg"
              style={{ background: "var(--dc-bg-elevated)" }}
            >
              <div className="text-lg font-bold" style={{ color: "var(--dc-text-primary)" }}>
                {answeredCount}/{questions.length}
              </div>
              <div className="text-xs" style={{ color: "var(--dc-text-muted)" }}>
                Answered
              </div>
            </div>
            <div
              className="text-center p-3 rounded-lg"
              style={{ background: "var(--dc-bg-elevated)" }}
            >
              <div className="text-lg font-bold" style={{ color: "var(--dc-text-primary)" }}>
                {timeTakenStr}
              </div>
              <div className="text-xs" style={{ color: "var(--dc-text-muted)" }}>
                Time Taken
              </div>
            </div>
            <div
              className="text-center p-3 rounded-lg"
              style={{ background: "var(--dc-bg-elevated)" }}
            >
              <div className="text-lg font-bold" style={{ color: "var(--dc-text-primary)" }}>
                {strongConcepts.length}
              </div>
              <div className="text-xs" style={{ color: "var(--dc-text-muted)" }}>
                Mastered
              </div>
            </div>
          </motion.div>

          {/* Concept Breakdown */}
          <div className="space-y-2">
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--dc-text-secondary)" }}
            >
              Concept Breakdown
            </h3>
            {conceptResults.map((c, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="flex items-center justify-between py-2 px-3 rounded-lg"
                style={{
                  background: "var(--dc-bg-elevated)",
                  border: "1px solid var(--dc-border-light)",
                }}
              >
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--dc-text-primary)" }}
                >
                  {c.tag.replace(/_/g, " ")}
                </span>
                <span
                  className={`score-badge ${
                    c.correct ? "green" : c.partial ? "amber" : "red"
                  }`}
                >
                  {c.correct ? "✓ Strong" : c.partial ? "~ Developing" : "✗ Weak"}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Revisit Resources — for weak concepts */}
        {weakConcepts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl p-4 mb-3"
            style={{
              background: "var(--dc-bg-tertiary)",
              border: "1px solid var(--dc-border)",
            }}
          >
            <h4
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: "var(--dc-warning)" }}
            >
              📚 Revisit These Concepts
            </h4>
            <div className="space-y-2">
              {weakConcepts.map((c, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg text-sm"
                  style={{
                    background: "var(--dc-bg-elevated)",
                    color: "var(--dc-text-primary)",
                  }}
                >
                  <span className="font-medium">{c.tag.replace(/_/g, " ")}</span>
                  <Lightbulb size={14} style={{ color: "var(--dc-text-muted)" }} />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl p-4"
          style={{
            background: "var(--dc-info-muted)",
            border: "1px solid rgba(88, 166, 255, 0.2)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--dc-info)" }}>
            <Lightbulb className="inline" size={16} /> <strong>Tip:</strong> Switch to{" "}
            <strong>Understand</strong> mode to explore the concepts you&apos;re weak
            on. Click any line for a detailed explanation.
          </p>
        </motion.div>


        {/* Try again button */}
        <button
          onClick={() => {
            useSessionStore.getState().resetTrivia();
            setAnswerInput("");
          }}
          className="dc-btn dc-btn-secondary mt-2 w-full"
        >
          <RefreshCw className="inline" size={16} /> New Session
        </button>
      </motion.div>
    );
  }

  // ─── Active Question ───
  return (
    <div className="flex flex-col h-full overflow-y-auto">

      <div
        className="px-4 py-3 flex items-center gap-3 "
        style={{
          background: "var(--dc-bg-tertiary)",
          borderBottom: "1px solid var(--dc-border)",
        }}
      >
        <div className="flex gap-1.5 flex-1">
          {questions.map((_, idx) => (
            <div
              key={idx}
              className="h-1.5 flex-1 rounded-full transition-all duration-300"
              style={{
                background:
                  idx < currentQuestionIndex
                    ? evaluations[idx]?.correct
                      ? "var(--dc-success)"
                      : evaluations[idx]?.partial
                      ? "var(--dc-warning)"
                      : "var(--dc-error)"
                    : idx === currentQuestionIndex
                    ? "var(--dc-accent-blue)"
                    : "var(--dc-border)",
              }}
            />
          ))}
        </div>
        <span
          className="text-xs font-medium"
          style={{ color: "var(--dc-text-muted)" }}
        >
          {currentQuestionIndex + 1}/{questions.length}
        </span>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {currentQuestion && (
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Difficulty & Concept Tag */}
            <div className="flex items-center gap-3 mb-5">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  background:
                    currentQuestion.difficulty === "surface"
                      ? "var(--dc-success-muted)"
                      : currentQuestion.difficulty === "conceptual"
                      ? "var(--dc-warning-muted)"
                      : "var(--dc-error-muted)",
                  color:
                    currentQuestion.difficulty === "surface"
                      ? "var(--dc-success)"
                      : currentQuestion.difficulty === "conceptual"
                      ? "var(--dc-warning)"
                      : "var(--dc-error)",
                  border: `1px solid ${
                    currentQuestion.difficulty === "surface"
                      ? "rgba(63, 185, 80, 0.3)"
                      : currentQuestion.difficulty === "conceptual"
                      ? "rgba(210, 153, 34, 0.3)"
                      : "rgba(248, 81, 73, 0.3)"
                  }`,
                }}
              >
                {currentQuestion.difficulty}
              </span>
              <span className="concept-chip">
                {currentQuestion.concept_tag.replace(/_/g, " ")}
              </span>
            </div>

            {/* Question */}
            <p
              className="text-[15px] font-medium leading-[1.7] mb-6"
              style={{ color: "var(--dc-text-primary)" }}
            >
              {currentQuestion.question}
            </p>



            {/* Answer Input */}
            {!questionFinished && (
              <div className="space-y-2">
                <textarea
                  id="answer-input"
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  placeholder={
                    (wrongAttempts[currentQuestionIndex] ?? 0) > 0
                      ? `Try again! (Attempt ${(wrongAttempts[currentQuestionIndex] ?? 0) + 1}/3)`
                      : "Type your answer here (minimum 10 characters)..."
                  }
                  rows={4}
                  className="w-full p-3 rounded-lg text-sm resize-none outline-none transition-all duration-200"
                  style={{
                    background: "var(--dc-bg-tertiary)",
                    border: "1px solid var(--dc-border)",
                    color: "var(--dc-text-primary)",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "var(--dc-accent-blue)")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = "var(--dc-border)")
                  }
                />
                <div className="flex items-center justify-between pt-2">
                  <span
                    className="text-xs"
                    style={{
                      color:
                        answerInput.length >= 10
                          ? "var(--dc-text-muted)"
                          : "var(--dc-error)",
                    }}
                  >
                    {answerInput.length}/10 min characters
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSkipQuestion}
                      disabled={evaluating}
                      className="text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                      style={{ color: "var(--dc-text-muted)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--dc-text-primary)", e.currentTarget.style.backgroundColor = "var(--dc-bg-elevated)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--dc-text-muted)", e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      Skip
                    </button>
                    <button
                      id="submit-answer-btn"
                      onClick={handleSubmitAnswer}
                      disabled={answerInput.length < 10 || evaluating}
                      className="dc-btn dc-btn-primary text-sm px-5 py-2"
                    >
                      {evaluating ? (
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Evaluating...
                        </span>
                      ) : (
                        "Submit Answer"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Evaluation Feedback */}
            <AnimatePresence>
              {currentEvaluation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl p-5 mt-4"
                  style={{
                    background: currentEvaluation.correct
                      ? "var(--dc-success-muted)"
                      : currentEvaluation.partial
                      ? "var(--dc-warning-muted)"
                      : "var(--dc-error-muted)",
                    border: `1px solid ${
                      currentEvaluation.correct
                        ? "rgba(63, 185, 80, 0.3)"
                        : currentEvaluation.partial
                        ? "rgba(210, 153, 34, 0.3)"
                        : "rgba(248, 81, 73, 0.3)"
                    }`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg flex items-center">
                      {currentEvaluation.correct
                        ? <CheckCircle2 className="inline text-dc-success" size={16} />
                        : currentEvaluation.partial
                        ? <HelpCircle className="inline" size={16} />
                        : <XCircle className="inline text-dc-error" size={16} />}
                    </span>
                    <span
                      className="text-sm font-semibold"
                      style={{
                        color: currentEvaluation.correct
                          ? "var(--dc-success)"
                          : currentEvaluation.partial
                          ? "var(--dc-warning)"
                          : "var(--dc-error)",
                      }}
                    >
                      {currentEvaluation.correct
                        ? `Correct! +${currentEvaluation.score_awarded} pts`
                        : currentEvaluation.partial
                        ? `Partial — +${currentEvaluation.score_awarded} pts`
                        : "Incorrect — hints available"}
                    </span>
                  </div>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--dc-text-primary)" }}
                  >
                    {currentEvaluation.feedback}
                  </p>
                  {currentEvaluation.concept_gap && (
                    <p
                      className="text-xs mt-2"
                      style={{ color: "var(--dc-text-secondary)" }}
                    >
                      <strong>Gap:</strong> {currentEvaluation.concept_gap}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>



            {/* Hints */}
            <AnimatePresence>
              {currentHints?.hints.map((hint, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`hint-card hint-${hint.hint_level} mt-3`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background:
                          hint.hint_level === 1
                            ? "var(--dc-info-muted)"
                            : hint.hint_level === 2
                            ? "var(--dc-shadow-glow-purple)"
                            : "rgba(63, 185, 162, 0.15)",
                        color:
                          hint.hint_level === 1
                            ? "var(--dc-info)"
                            : hint.hint_level === 2
                            ? "var(--dc-accent-purple)"
                            : "var(--dc-accent-teal)",
                      }}
                    >
                      {hint.hint_level === 1
                        ? <span className="flex items-center gap-2"><Lightbulb className="inline" size={16} /> Nudge</span>
                        : hint.hint_level === 2
                        ? "🌍 Analogy"
                        : <span className="flex items-center gap-2"><BookOpen className="inline" size={16} /> Full Explanation</span>}
                    </span>
                  </div>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--dc-text-primary)" }}
                  >
                    {hint.hint_text}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Next / Finish buttons */}
            <div className="flex items-center gap-2 mt-4">
              {questionFinished && (
                <button
                  id="next-question-btn"
                  onClick={handleNext}
                  className="dc-btn dc-btn-primary text-sm ml-auto"
                >
                  {currentQuestionIndex < questions.length - 1
                    ? "Next Question →"
                    : "Finish Session →"}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}