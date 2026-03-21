import { create } from "zustand";

/**
 * UI Store (0.5)
 *
 * Manages presentational UI state that doesn't belong in
 * the session or editor stores.
 */
interface UIState {
  sidebarOpen: boolean;
  activePanel: "trivia" | "understand" | "summary" | null;
  isLoading: boolean;

  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setActivePanel: (panel: UIState["activePanel"]) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activePanel: "trivia",
  isLoading: false,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setActivePanel: (panel) => set({ activePanel: panel }),
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
