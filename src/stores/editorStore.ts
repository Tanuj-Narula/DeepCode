import { create } from "zustand";
import type { SupportedLanguage } from "@/types/schemas";

interface EditorState {
  code: string;
  language: SupportedLanguage;
  cursorLine: number;
  scopedFunction: string | null;
  scopeStartLine: number | null;
  scopeEndLine: number | null;

  setCode: (code: string) => void;
  setLanguage: (language: SupportedLanguage) => void;
  setCursorLine: (line: number) => void;
  setScopedFunction: (fn: string | null, startLine?: number, endLine?: number) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  code: `// Add code in JavaScript\n\nconsole.log("Hello World!");`,
  language: "javascript",
  cursorLine: 1,
  scopedFunction: null,
  scopeStartLine: null,
  scopeEndLine: null,

  setCode: (code) => set({ code }),
  setLanguage: (language) => set({ language }),
  setCursorLine: (line) => set({ cursorLine: line }),
  setScopedFunction: (fn, startLine, endLine) =>
    set({
      scopedFunction: fn,
      scopeStartLine: startLine ?? null,
      scopeEndLine: endLine ?? null,
    }),
}));
