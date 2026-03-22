import { z } from "zod";

// ─── Question Generation Schema ───
export const QuestionSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string(),
        difficulty: z.enum(["surface", "conceptual", "edge_case", "adversarial"]),
        concept_tag: z.string(),
        expected_keywords: z.array(z.string()),
      })
    )
    .length(3),
});

export type QuestionSet = z.infer<typeof QuestionSchema>;
export type Question = QuestionSet["questions"][number];

// ─── Answer Evaluation Schema ───
export const EvaluationSchema = z.object({
  correct: z.boolean(),
  partial: z.boolean(),
  score_awarded: z.number().int().min(0).max(10),
  feedback: z.string(),
  concept_gap: z.string().nullish(),
});

export type Evaluation = z.infer<typeof EvaluationSchema>;

// ─── Hint Schema ───
export const HintSchema = z.object({
  hint_text: z.string(),
  hint_level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

export type Hint = z.infer<typeof HintSchema>;

// ─── Line Explanation Schema ───
export const LineExplanationSchema = z.object({
  what_it_does: z.string(),
  why_this_way: z.string(),
  what_breaks_if_removed: z.string(),
});

export type LineExplanation = z.infer<typeof LineExplanationSchema>;

// ─── Function Walkthrough Schema ───
export const WalkthroughSchema = z.object({
  purpose: z.string(),
  inputs: z.string(),
  steps: z.array(
    z.object({
      step_number: z.number(),
      description: z.string(),
      code_reference: z.string().optional(),
    })
  ),
  output: z.string(),
  edge_cases: z.array(z.string()),
});

export type Walkthrough = z.infer<typeof WalkthroughSchema>;

// ─── What-If Simulation Schema ───
export const WhatIfSchema = z.object({
  scenario: z.string(),
  consequence: z.string(),
  reasoning: z.string(),
});

export type WhatIf = z.infer<typeof WhatIfSchema>;

// ─── What-If Suggestions Schema ───
export const WhatIfSuggestionsSchema = z.object({
  suggestions: z.array(z.string()).min(1).max(3),
});

export type WhatIfSuggestions = z.infer<typeof WhatIfSuggestionsSchema>;

// ─── Analogy Schema ───
export const AnalogySchema = z.object({
  analogy_text: z.string(),
  concept_mapped: z.string(),
});

export type Analogy = z.infer<typeof AnalogySchema>;

// ─── Rubber Duck Evaluation Schema ───
export const RubberDuckEvalSchema = z.object({
  accuracy_score: z.number().min(0).max(100),
  completeness_score: z.number().min(0).max(100),
  edge_case_identification: z.number().min(0).max(100),
  clarity: z.number().min(0).max(100),
  missing_concepts: z.array(z.string()),
  well_explained: z.array(z.string()),
  overall_feedback: z.string(),
});

export type RubberDuckEval = z.infer<typeof RubberDuckEvalSchema>;

// ─── Supported Languages ───
export type SupportedLanguage = "javascript" | "typescript" | "python" | "java" | "cpp" | "go" | "rust" | "csharp";

// ─── Mode Types ───
export type AppMode = "trivia" | "understand";

// ─── Global History (for Role Assessment) ───
export interface GlobalHistoryResult {
  timestamp: number;
  concepts: string[];
  avgScore: number;
  totalQuestions: number;
}

// ─── Session Result (for single session persistence) ───
export interface SessionResult {
  questionIndex: number;
  conceptTag: string;
  difficulty: string;
  correct: boolean;
  partial: boolean;
  hintsUsed: number;
  confidenceRated: number;
  scoreAwarded: number;
  retryCorrect: boolean;
  timestamp: number;
}

// ─── Hint Progress per Question ───
export interface HintProgress {
  currentLevel: 0 | 1 | 2 | 3;
  hints: Hint[];
}

// ─── Mutation Prediction Schema (Feature 3) ───
export const MutationPredictionSchema = z.object({
  explanation: z.string(),
});

export type MutationPrediction = z.infer<typeof MutationPredictionSchema>;

// ─── History Session (persisted to localStorage) ───
export interface HistoryQuestionResult {
  conceptTag: string;
  difficulty: string;
  correct: boolean;
  partial: boolean;
  scoreAwarded: number;
  hintsUsed: number;
}

export interface HistorySession {
  id: string;
  timestamp: number;
  durationMs: number;
  language: SupportedLanguage;
  seedConcept: string | null;
  totalScore: number;
  maxPossibleScore: number;
  results: HistoryQuestionResult[];
}
