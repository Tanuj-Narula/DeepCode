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
  const { mode,    heatmapData, 
    clickedLine, 
    setClickedLine, 
    setActiveLineExplanation, 
    setUnderstandLoading, 
    setCodeWatchAlert,
    currentAlert
  } =
    useSessionStore();

  const codeWatchDecorationsRef = useRef<string[]>([]);
  const lastAnalyzedHashRef = useRef<string | null>(null);

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
        if (mode === "understand" && e.target.position) {
          const lineNumber = e.target.position.lineNumber;
          setClickedLine(lineNumber);

          // Fetch line explanation
          const lineModel = editor.getModel();
          if (lineModel) {
            const lineContent = lineModel.getLineContent(lineNumber);
            if (lineContent.trim()) {
              fetchLineExplanation(lineNumber, lineContent);
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
      setUnderstandLoading(true);
      setActiveLineExplanation(null);

      try {
        const scope = extractScope(code, lineNumber);
        const res = await fetch("/api/explain-line", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lineContent,
            lineNumber,
            functionCode: scope.scopedCode,
            language,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [code, language]
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

  // CodeWatch: Passive Scan (Feature 4)
  useEffect(() => {
    if (!scopedFunction) return;

    // Simple hash to avoid redundant API calls
    const hash = btoa(unescape(encodeURIComponent(scopedFunction))).slice(0, 16);
    if (hash === lastAnalyzedHashRef.current) return;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/codewatch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: scopedFunction, language }),
        });

        if (!res.ok) throw new Error();
        const result = await res.json();

        if (result.found) {
          setCodeWatchAlert(result);
          lastAnalyzedHashRef.current = hash;
          
          if (editorRef.current) {
            const startLine = (useEditorStore.getState().scopeStartLine ?? 1);
            const relativeLine = result.affectedLine ?? 1;
            const targetLine = startLine + relativeLine - 1;

            const decoration: MonacoEditor.IModelDeltaDecoration = {
              range: { startLineNumber: targetLine, startColumn: 1, endLineNumber: targetLine, endColumn: 1 },
              options: {
                isWholeLine: true,
                className: result.severity === "warning" ? "codewatch-warning" : "codewatch-info",
                glyphMarginClassName: result.severity === "warning" ? "codewatch-warning-glyph" : "codewatch-info-glyph",
                hoverMessage: { value: `**DEEPCODE WATCH**: ${result.explanation}` }
              }
            };

            codeWatchDecorationsRef.current = editorRef.current.deltaDecorations(
              codeWatchDecorationsRef.current,
              [decoration]
            );
          }
          toast(`DeepCode found an issue: ${result.title}`, { icon: "🧐" });
        } else {
          setCodeWatchAlert(null);
          lastAnalyzedHashRef.current = hash;
          if (editorRef.current) {
            codeWatchDecorationsRef.current = editorRef.current.deltaDecorations(codeWatchDecorationsRef.current, []);
          }
        }
      } catch (e) {
        console.error("CodeWatch failed", e);
      }
    }, 8000); // Debounce diagnostic to 8 seconds

    return () => clearTimeout(timer);
  }, [scopedFunction, language, setCodeWatchAlert]);

  // Sync editor read-only with mode
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        readOnly: mode === "understand",
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
