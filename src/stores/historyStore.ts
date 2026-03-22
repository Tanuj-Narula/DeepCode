import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HistorySession } from "@/types/schemas";

interface HistoryState {
  sessions: HistorySession[];
  addSession: (session: HistorySession) => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      sessions: [],
      addSession: (session) =>
        set((state) => ({
          sessions: [session, ...state.sessions].slice(0, 50), // keep latest 50
        })),
      clearHistory: () => set({ sessions: [] }),
    }),
    {
      name: "dc-history",
    }
  )
);
