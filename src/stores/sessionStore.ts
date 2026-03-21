import { create } from "zustand";
import type {
  AppMode,
  Question,
  Evaluation,
  HintProgress,
  LineExplanation,
  Walkthrough,
  HeatmapStatus,
  SessionResult,
  GlobalHistoryResult,
  RoadmapData,
  CodeWatchAlert,
} from "@/types/schemas";
import { RoleReadiness } from "@/data/roleReadiness";

interface SessionState {
  // Mode
  mode: AppMode;
  setMode: (mode: AppMode) => void;

  // Trivia state
  questions: Question[];
  currentQuestionIndex: number;
  userAnswers: Record<number, string>;
  evaluations: Record<number, Evaluation>;
  hintProgress: Record<number, HintProgress>;
  confidenceRatings: Record<number, number>;
  retryResults: Record<number, boolean>;
  sessionResults: GlobalHistoryResult[];
  triviaComplete: boolean;
  triviaLoading: boolean;

  // Understand state
  activeLineExplanation: LineExplanation | null;
  activeWalkthrough: Walkthrough | null;
  clickedLine: number | null;
  understandLoading: boolean;

  // Heatmap
  heatmapData: Record<number, HeatmapStatus>;

  // Scoring
  totalScore: number;
  maxPossibleScore: number;

  // Session timing
  sessionStartTime: number | null;

  // Seed Project Mode (Feature 1)
  seedConcept: string | null;
  isSeedSession: boolean;
  setSeedSession: (concept: string | null, isSeed: boolean) => void;

  // Actions — Trivia
  setQuestions: (q: Question[]) => void;
  setCurrentQuestionIndex: (i: number) => void;
  setUserAnswer: (questionIndex: number, answer: string) => void;
  setEvaluation: (questionIndex: number, evaluation: Evaluation) => void;
  addHint: (questionIndex: number, hint: HintProgress) => void;
  setConfidenceRating: (questionIndex: number, rating: number) => void;
  setRetryResult: (questionIndex: number, correct: boolean) => void;
  addSessionResult: (result: GlobalHistoryResult) => void;
  setTriviaComplete: (complete: boolean) => void;
  setTriviaLoading: (loading: boolean) => void;

  // Roadmap State (Feature 2)
  roadmap: RoadmapData | null;
  roadmapProgress: Record<string, "not_started" | "attempted" | "mastered">;
  setRoadmap: (roadmap: RoadmapData | null) => void;
  setRoadmapProgress: (concept: string, status: "not_started" | "attempted" | "mastered") => void;
  loadRoadmap: () => void; // Mock local logic

  // CodeWatch State (Feature 4)
  currentAlert: CodeWatchAlert | null;
  setCodeWatchAlert: (alert: CodeWatchAlert | null) => void;

  // Role Readiness (Feature 5)
  roleReadiness: RoleReadiness | null;
  setRoleReadiness: (readiness: RoleReadiness | null) => void;

  // Actions — Understand
  setActiveLineExplanation: (exp: LineExplanation | null) => void;
  setActiveWalkthrough: (wt: Walkthrough | null) => void;
  setClickedLine: (line: number | null) => void;
  setUnderstandLoading: (loading: boolean) => void;

  // Actions — Heatmap
  setHeatmapData: (data: Record<number, HeatmapStatus>) => void;

  // Actions — Score
  updateScore: (points: number) => void;

  // Actions — Reset
  resetTrivia: () => void;
  resetSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  mode: "trivia",
  questions: [],
  currentQuestionIndex: 0,
  userAnswers: {},
  evaluations: {},
  hintProgress: {},
  confidenceRatings: {},
  retryResults: {},
  sessionResults: [],
  triviaComplete: false,
  triviaLoading: false,

  activeLineExplanation: null,
  activeWalkthrough: null,
  clickedLine: null,
  understandLoading: false,

  heatmapData: {},
  totalScore: 0,
  maxPossibleScore: 30,
  sessionStartTime: null,
  seedConcept: null,
  isSeedSession: false,
  roadmap: null,
  roadmapProgress: {},
  currentAlert: null,
  roleReadiness: null,

  setMode: (mode) => set({ mode }),
  setQuestions: (questions) =>
    set({
      questions,
      currentQuestionIndex: 0,
      userAnswers: {},
      evaluations: {},
      hintProgress: {},
      confidenceRatings: {},
      retryResults: {},
      triviaComplete: false,
      totalScore: 0,
      sessionStartTime: Date.now(),
    }),
  setCurrentQuestionIndex: (i) => set({ currentQuestionIndex: i }),
  setUserAnswer: (questionIndex, answer) =>
    set((state) => ({
      userAnswers: { ...state.userAnswers, [questionIndex]: answer },
    })),
  setEvaluation: (questionIndex, evaluation) =>
    set((state) => ({
      evaluations: { ...state.evaluations, [questionIndex]: evaluation },
    })),
  addHint: (questionIndex, hint) =>
    set((state) => ({
      hintProgress: { ...state.hintProgress, [questionIndex]: hint },
    })),
  setConfidenceRating: (questionIndex, rating) =>
    set((state) => ({
      confidenceRatings: { ...state.confidenceRatings, [questionIndex]: rating },
    })),
  setRetryResult: (questionIndex, correct) =>
    set((state) => ({
      retryResults: { ...state.retryResults, [questionIndex]: correct },
    })),
  addSessionResult: (result) =>
    set((state) => ({
      sessionResults: [...state.sessionResults, result],
    })),
  setTriviaComplete: (complete) => set({ triviaComplete: complete }),
  setTriviaLoading: (loading) => set({ triviaLoading: loading }),

  setActiveLineExplanation: (exp) => set({ activeLineExplanation: exp }),
  setActiveWalkthrough: (wt) => set({ activeWalkthrough: wt }),
  setClickedLine: (line) => set({ clickedLine: line }),
  setUnderstandLoading: (loading) => set({ understandLoading: loading }),

  setSeedSession: (concept, isSeed) => set({ seedConcept: concept, isSeedSession: isSeed }),

  setRoadmap: (roadmap) => set({ roadmap }),
  setRoadmapProgress: (concept, status) => set((state) => ({
    roadmapProgress: { ...state.roadmapProgress, [concept]: status }
  })),
  loadRoadmap: () => {
      // Logic for initial load if necessary
  },

  setCodeWatchAlert: (alert) => set({ currentAlert: alert }),
  setRoleReadiness: (readiness) => set({ roleReadiness: readiness }),

  setHeatmapData: (data) => set({ heatmapData: data }),
  updateScore: (points) =>
    set((state) => ({ totalScore: state.totalScore + points })),

  resetTrivia: () =>
    set({
      questions: [],
      currentQuestionIndex: 0,
      userAnswers: {},
      evaluations: {},
      hintProgress: {},
      confidenceRatings: {},
      retryResults: {},
      triviaComplete: false,
      triviaLoading: false,
      totalScore: 0,
      sessionStartTime: null,
    }),

  resetSession: () =>
    set({
      questions: [],
      currentQuestionIndex: 0,
      userAnswers: {},
      evaluations: {},
      hintProgress: {},
      confidenceRatings: {},
      retryResults: {},
      sessionResults: [],
      triviaComplete: false,
      triviaLoading: false,
      activeLineExplanation: null,
      activeWalkthrough: null,
      clickedLine: null,
      understandLoading: false,
      heatmapData: {},
      totalScore: 0,
      maxPossibleScore: 30,
      sessionStartTime: null,
    }),
}));
