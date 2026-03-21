/**
 * Heatmap Decorations Utility (D3)
 *
 * Generates Monaco deltaDecorations for the gutter heatmap.
 * Colors each line based on understanding level after a Trivia session.
 */

import type { HeatmapStatus } from "@/types/schemas";

interface MonacoEditor {
  deltaDecorations(
    oldDecorations: string[],
    newDecorations: Array<{
      range: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number };
      options: {
        isWholeLine?: boolean;
        className?: string;
        glyphMarginClassName?: string;
        linesDecorationsClassName?: string;
      };
    }>
  ): string[];
}

const STATUS_TO_CLASS: Record<HeatmapStatus, string> = {
  green: "dc-line-green",
  amber: "dc-line-amber",
  red: "dc-line-red",
  grey: "dc-line-grey",
};

/**
 * Apply heatmap colouring to the Monaco editor gutter.
 * Returns the decoration IDs so they can be cleared later.
 */
export function applyHeatmapDecorations(
  editor: MonacoEditor,
  heatmapData: Record<number, HeatmapStatus>,
  oldDecorations: string[]
): string[] {
  const newDecorations = Object.entries(heatmapData).map(([lineStr, status]) => {
    const lineNumber = parseInt(lineStr, 10);
    return {
      range: {
        startLineNumber: lineNumber,
        startColumn: 1,
        endLineNumber: lineNumber,
        endColumn: 1,
      },
      options: {
        isWholeLine: true,
        className: STATUS_TO_CLASS[status],
        linesDecorationsClassName: STATUS_TO_CLASS[status],
      },
    };
  });

  return editor.deltaDecorations(oldDecorations, newDecorations);
}

/**
 * Apply the active line highlight for "Why this line?" in Understand mode.
 */
export function applyActiveLineDecoration(
  editor: MonacoEditor,
  lineNumber: number,
  oldDecorations: string[]
): string[] {
  return editor.deltaDecorations(oldDecorations, [
    {
      range: {
        startLineNumber: lineNumber,
        startColumn: 1,
        endLineNumber: lineNumber,
        endColumn: 1,
      },
      options: {
        isWholeLine: true,
        className: "dc-active-line",
      },
    },
  ]);
}

/**
 * Clear all decorations.
 */
export function clearDecorations(
  editor: MonacoEditor,
  decorationIds: string[]
): string[] {
  return editor.deltaDecorations(decorationIds, []);
}
