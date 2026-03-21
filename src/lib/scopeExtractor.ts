/**
 * Scope Extractor (A2)
 *
 * Given a full source code string and a cursor line number,
 * extracts the enclosing function/block (20–80 lines max).
 * Uses regex-based boundary detection for MVP.
 */

interface ScopeResult {
  scopedCode: string;
  startLine: number;
  endLine: number;
  functionName: string | null;
}

/**
 * Finds the function/block boundaries containing the cursor line.
 * Handles: arrow functions, function declarations, class methods,
 * async variants, and export statements.
 */
export function extractScope(code: string, cursorLine: number): ScopeResult {
  const lines = code.split("\n");

  // Clamp cursor line to valid range (1-indexed)
  const clampedCursor = Math.max(1, Math.min(cursorLine, lines.length));

  // Patterns that start a function/block
  const functionStartPatterns = [
    // Named function declaration:  function foo(...)  or  async function foo(...)
    /^(?:export\s+)?(?:export\s+default\s+)?(?:async\s+)?function\s+(\w+)\s*\(/,
    // Arrow function assigned to const/let/var:  const foo = (...) =>  or  const foo = async (...) =>
    /^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[a-zA-Z_$]\w*)\s*=>/,
    // Class method:  methodName(...)  or  async methodName(...)  or  static methodName(...)
    /^\s+(?:static\s+)?(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{/,
    // Arrow function assigned to const with function keyword:  const foo = function(...)
    /^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?function\s*\(/,
  ];

  // Find the start of the enclosing function
  let functionStartLine = -1;
  let functionName: string | null = null;

  for (let i = clampedCursor - 1; i >= 0; i--) {
    const line = lines[i]!;
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
      continue;
    }

    for (const pattern of functionStartPatterns) {
      const match = trimmed.match(pattern);
      if (match) {
        functionStartLine = i;
        functionName = match[1] ?? null;
        break;
      }
    }

    if (functionStartLine !== -1) break;
  }

  // If no function found, return a window around the cursor
  if (functionStartLine === -1) {
    const start = Math.max(0, clampedCursor - 20);
    const end = Math.min(lines.length - 1, clampedCursor + 20);
    return {
      scopedCode: lines.slice(start, end + 1).join("\n"),
      startLine: start + 1,
      endLine: end + 1,
      functionName: null,
    };
  }

  // Find the end of the function by tracking braces
  let braceCount = 0;
  let foundOpen = false;
  let functionEndLine = functionStartLine;

  for (let i = functionStartLine; i < lines.length; i++) {
    const line = lines[i]!;

    for (const char of line) {
      if (char === "{") {
        braceCount++;
        foundOpen = true;
      } else if (char === "}") {
        braceCount--;
      }
    }

    if (foundOpen && braceCount === 0) {
      functionEndLine = i;
      break;
    }

    // Safety: don't extract more than 80 lines
    if (i - functionStartLine >= 79) {
      functionEndLine = i;
      break;
    }
  }

  // If we never found a closing brace, extend a reasonable amount
  if (!foundOpen) {
    functionEndLine = Math.min(functionStartLine + 40, lines.length - 1);
  }

  // Ensure minimum 5 lines for context
  if (functionEndLine - functionStartLine < 5) {
    functionEndLine = Math.min(functionStartLine + 10, lines.length - 1);
  }

  const scopedCode = lines.slice(functionStartLine, functionEndLine + 1).join("\n");

  return {
    scopedCode,
    startLine: functionStartLine + 1, // Convert to 1-indexed
    endLine: functionEndLine + 1,
    functionName,
  };
}

/**
 * Extracts minimal import statements from the top of the file
 * to provide context to the AI.
 */
export function extractImports(code: string): string {
  const lines = code.split("\n");
  const importLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.startsWith("import ") ||
      trimmed.startsWith("const ") && trimmed.includes("require(") ||
      trimmed.startsWith("from ") ||
      (importLines.length > 0 && trimmed.startsWith("}"))
    ) {
      importLines.push(line);
    }

    // Stop scanning once we hit non-import code (after some imports were found)
    if (
      importLines.length > 0 &&
      trimmed.length > 0 &&
      !trimmed.startsWith("import ") &&
      !trimmed.startsWith("const ") &&
      !trimmed.startsWith("from ") &&
      !trimmed.startsWith("}") &&
      !trimmed.startsWith("//") &&
      !trimmed.startsWith("/*") &&
      !trimmed.startsWith("*") &&
      trimmed !== ""
    ) {
      break;
    }
  }

  return importLines.join("\n");
}
