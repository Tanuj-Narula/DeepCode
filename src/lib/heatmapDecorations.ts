/**
 * Heatmap Decorations Utility (D3)
 *
 * Generates Monaco deltaDecorations for the gutter heatmap.
 * Colors each line based on understanding level after a Trivia session.
 */


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


/**
 * Apply a subtle highlight across the entire scoped function range
 * to show the user which lines form the question context in Trivia mode.
 */
export function applyContextRangeDecoration(
  editor: MonacoEditor,
  startLine: number,
  endLine: number,
  oldDecorations: string[]
): string[] {
  const newDecorations = [];
  for (let line = startLine; line <= endLine; line++) {
    newDecorations.push({
      range: {
        startLineNumber: line,
        startColumn: 1,
        endLineNumber: line,
        endColumn: 1,
      },
      options: {
        isWholeLine: true,
        className: "dc-context-line",
      },
    });
  }
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
