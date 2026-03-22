"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import Editor, { type OnMount, type OnChange } from "@monaco-editor/react";
import type { editor as MonacoEditor } from "monaco-editor";
import { useEditorStore } from "@/stores/editorStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useTheme } from "next-themes";
import toast from "react-hot-toast";
import { extractScope } from "@/lib/scopeExtractor";
import {
  applyContextRangeDecoration,
  applyActiveLineDecoration,
  clearDecorations,
} from "@/lib/heatmapDecorations";

export default function CodeEditor() {
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const activeLineDecorationsRef = useRef<string[]>([]);
  const contextDecorationsRef = useRef<string[]>([]);
  const [isEditorReady, setIsEditorReady] = useState(false);
  // Snapshot of scope at question-generation time — stays locked for the whole session
  const [lockedScope, setLockedScope] = useState<{ start: number; end: number } | null>(null);
  const { resolvedTheme } = useTheme();

  const { code, language, scopedFunction, scopeStartLine, scopeEndLine, setCode, setCursorLine, setScopedFunction } =
    useEditorStore();
  const { mode,
    questions,
    triviaComplete,
    clickedLine,
    setClickedLine,
    setActiveLineExplanation,
    setUnderstandLoading,
    resetTrivia,
  } =
    useSessionStore();

  const triggerExplanation = useCallback(
    async (lineNumber: number, lineContent: string, currentCode: string, currentLanguage: string) => {
      setUnderstandLoading(true);
      setActiveLineExplanation(null);

      try {
        // Extract context (±2 lines)
        const allLines = currentCode.split("\n");
        const startIndex = Math.max(0, lineNumber - 3);
        const endIndex = Math.min(allLines.length - 1, lineNumber + 1);
        
        const contextLines = allLines.slice(startIndex, endIndex + 1);
        const targetLineIndex = (lineNumber - 1) - startIndex;

        const scope = extractScope(currentCode, lineNumber);
        const res = await fetch("/api/explain-line", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lineContent,
            lineNumber,
            contextLines,
            targetLineIndex,
            functionCode: scope.scopedCode,
            language: currentLanguage,
          }),
        });

        if (!res.ok) throw new Error("Failed to get explanation");

        const data = await res.json();
        setActiveLineExplanation(data);
      } catch {
        console.error("Line explanation failed");
      } finally {
        setUnderstandLoading(false);
      }
    },
    [setUnderstandLoading, setActiveLineExplanation]
  );

  const triggerExplanationRef = useRef(triggerExplanation);
  useEffect(() => {
    triggerExplanationRef.current = triggerExplanation;
  }, [triggerExplanation]);

  const handleEditorMount: OnMount = useCallback(
    (editor) => {
      editorRef.current = editor;
      setIsEditorReady(true);

      // Track cursor position
      editor.onDidChangeCursorPosition((e) => {
        const lineNumber = e.position.lineNumber;
        setCursorLine(lineNumber);

        // Auto-extract scope when cursor moves
        const scope = extractScope(editor.getValue(), lineNumber);
        setScopedFunction(
          scope.scopedCode,
          scope.startLine,
          scope.endLine
        );
      });

      // Handle line clicks in Understand mode
      editor.onMouseDown((e) => {
        const currentMode = useSessionStore.getState().mode;
        if (currentMode === "understand" && e.target.position) {
          const lineNumber = e.target.position.lineNumber;
          setClickedLine(lineNumber);

          // Fetch line explanation
          const lineModel = editor.getModel();
          if (lineModel) {
            const lineContent = lineModel.getLineContent(lineNumber);
            if (lineContent.trim()) {
              // Trigger explanation directly from store to avoid stale closures
              const currentCode = useEditorStore.getState().code;
              const currentLanguage = useEditorStore.getState().language;
              
              triggerExplanationRef.current(lineNumber, lineContent, currentCode, currentLanguage);
            }
          }
        }
      });

      // Initial scope extraction
      const initialScope = extractScope(code, 1);
      setScopedFunction(
        initialScope.scopedCode,
        initialScope.startLine,
        initialScope.endLine
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode]
  );



  const fetchLineExplanation = useCallback(
    async (lineNumber: number, lineContent: string) => {
        triggerExplanation(lineNumber, lineContent, code, language);
    },
    [code, language, triggerExplanation]
  );

  const handleChange: OnChange = useCallback(
    (value) => {
      if (value !== undefined) {
        setCode(value);
      }
    },
    [setCode]
  );


  // Apply active line decoration in Understand mode
  useEffect(() => {
    if (editorRef.current && isEditorReady) {
      if (mode === "understand" && clickedLine) {
        activeLineDecorationsRef.current = applyActiveLineDecoration(
          editorRef.current,
          clickedLine,
          activeLineDecorationsRef.current
        );
      } else {
        activeLineDecorationsRef.current = clearDecorations(
          editorRef.current,
          activeLineDecorationsRef.current
        );
      }
    }
  }, [clickedLine, mode, isEditorReady]);

  // Reset trivia when the user pastes new code or changes the language
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    // Only reset if a session is actually in progress
    if (useSessionStore.getState().questions.length > 0) {
      resetTrivia();
    }
  // intentionally NOT including `mode` so switching modes doesn't reset
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, language]);

  // Snapshot scope when questions first appear; clear when session resets
  useEffect(() => {
    if (questions.length > 0 && !triviaComplete) {
      // Only set once — never update mid-session so the highlight stays frozen
      setLockedScope(prev => {
        if (prev) return prev; // already locked
        if (scopeStartLine != null && scopeEndLine != null) {
          return { start: scopeStartLine, end: scopeEndLine };
        }
        return null;
      });
    } else {
      setLockedScope(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions.length, triviaComplete]);

  // Highlight the locked scope context while a trivia question is active
  useEffect(() => {
    if (!editorRef.current || !isEditorReady) return;

    if (lockedScope && mode === "trivia" && questions.length > 0 && !triviaComplete) {
      contextDecorationsRef.current = applyContextRangeDecoration(
        editorRef.current,
        lockedScope.start,
        lockedScope.end,
        contextDecorationsRef.current
      );
      // Scroll only when scope is first locked (questions just generated)
      editorRef.current.revealLinesInCenter(lockedScope.start, lockedScope.end, 0);
    } else {
      contextDecorationsRef.current = clearDecorations(
        editorRef.current,
        contextDecorationsRef.current
      );
    }
  }, [lockedScope, mode, questions.length, triviaComplete, isEditorReady]);



  // Sync editor read-only with mode (DEPRECATED - User wants it editable)
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        readOnly: false,
      });
    }
  }, [mode]);

  const monacoLanguageMap: Record<string, string> = {
    javascript: "javascript",
    typescript: "typescript",
    python: "python",
    java: "java",
    cpp: "cpp",
    go: "go",
    rust: "rust",
    csharp: "csharp",
  };

  return (
    <div className="flex-1 min-w-0 h-full p-4">
      <div className="relative w-full h-full rounded-xl flex flex-col overflow-hidden border shadow-sm transition-all" style={{ borderColor: "var(--dc-border)", backgroundColor: "var(--dc-bg-primary)" }}>
        {/* Editor status bar */}
        <div
          className="flex items-center justify-between px-4 py-1.5"
          style={{
            background: "var(--dc-bg-tertiary)",
            borderBottom: "1px solid var(--dc-border)",
            fontSize: "0.75rem",
            color: "var(--dc-text-muted)",
          }}
        >
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  background:
                    mode === "understand"
                      ? "var(--dc-accent-purple)"
                      : "var(--dc-success)",
                }}
              />
              {mode === "understand" ? "Click a line to explain" : "Editor ready"}
            </span>
          </div>
          <span style={{ fontFamily: "var(--font-ibm-mono)" }}>
            {language.toUpperCase()}
          </span>
        </div>

        <div className="flex-1 relative w-full h-full min-h-0">
          <Editor
            height="100%"
            language={monacoLanguageMap[language] || "javascript"}
            value={code}
            onChange={handleChange}
            onMount={handleEditorMount}
            theme={resolvedTheme === "light" ? "light" : "vs-dark"}
            options={{
              fontSize: 14,
              fontFamily: "'IBM Plex Mono', var(--font-ibm-mono), SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              minimap: { enabled: false },
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              padding: { top: 16, bottom: 24 },
              glyphMargin: true,
              folding: true,
              wordWrap: "on",
              automaticLayout: true,
              renderLineHighlight: "gutter",
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              smoothScrolling: true,
              bracketPairColorization: { enabled: true },
            }}
          />
        </div>
      </div>
    </div>
  );
}
