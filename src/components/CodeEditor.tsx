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
  applyHeatmapDecorations,
  applyActiveLineDecoration,
  clearDecorations,
} from "@/lib/heatmapDecorations";

export default function CodeEditor() {
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const heatmapDecorationsRef = useRef<string[]>([]);
  const activeLineDecorationsRef = useRef<string[]>([]);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const { resolvedTheme } = useTheme();

  const { code, language, scopedFunction, setCode, setCursorLine, setScopedFunction } =
    useEditorStore();
  const { mode, heatmapData, 
    clickedLine, 
    setClickedLine, 
    setActiveLineExplanation,
    setUnderstandLoading
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

  // Apply heatmap decorations when heatmap data changes
  useEffect(() => {
    if (editorRef.current && isEditorReady && Object.keys(heatmapData).length > 0) {
      heatmapDecorationsRef.current = applyHeatmapDecorations(
        editorRef.current,
        heatmapData,
        heatmapDecorationsRef.current
      );
    }
  }, [heatmapData, isEditorReady]);

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
          className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-1.5"
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

        <div className="flex-1 pt-6 relative">
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
