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
  code: `// Paste your code here, or try this example:

async function fetchUserData(userId) {
  if (!userId) {
    throw new Error("userId is required");
  }

  try {
    const response = await fetch(\`/api/users/\${userId}\`);

    if (!response.ok) {
      throw new Error(\`HTTP \${response.status}: Failed to fetch user\`);
    }

    const data = await response.json();

    const { name, email, preferences = {} } = data;

    return {
      ...data,
      displayName: name || email.split("@")[0],
      isVerified: Boolean(data.verifiedAt),
      preferences: {
        theme: "dark",
        notifications: true,
        ...preferences,
      },
    };
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Network error — check your connection");
    }
    throw error;
  }
}`,
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
