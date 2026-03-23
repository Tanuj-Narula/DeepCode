import { NextRequest, NextResponse } from "next/server";
import { callAI, parseAIResponse } from "@/lib/ai";
import { z } from "zod";
import type { SupportedLanguage } from "@/types/schemas";

const SeedRequestSchema = z.object({
  concept: z.string(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  language: z.string().optional(), // if omitted, auto-detected
});

// Heuristic map: concept keywords → best language
const CONCEPT_TO_LANGUAGE: Array<{ keywords: string[]; language: SupportedLanguage }> = [
  { keywords: ["goroutine", "channel", "concurrency", "go routine", "select", "waitgroup", "golang"], language: "go" },
  { keywords: ["ownership", "borrow", "lifetime", "trait", "cargo", "unsafe", "memory safety", "rust"], language: "rust" },
  { keywords: ["pointer", "memory", "malloc", "template", "stl", "vector", "c++", "cpp", "destructor", "raii"], language: "cpp" },
  { keywords: ["thread", "jvm", "interface", "generics", "spring", "maven", "java", "inheritance", "polymorphism", "oop"], language: "java" },
  { keywords: ["list comprehension", "decorator", "generator", "pandas", "numpy", "asyncio", "python", "lambda", "dict", "slice"], language: "python" },
  { keywords: ["linq", "delegate", "async/await c#", "csharp", "c#", ".net", "nullable", "extension method"], language: "csharp" },
  { keywords: ["typescript", "ts ", " ts", "type annotation", "interface", "generic", "enum", "union"], language: "typescript" },
  { keywords: ["javascript", "js ", " js", "prototype", "closure", "event loop", "promise", "async/await js", "callback"], language: "javascript" },
];

function detectLanguage(concept: string): SupportedLanguage | null {
  const lower = concept.toLowerCase();
  
  // Try to match specific words first to avoid substring issues (e.g., 'java' in 'javascript')
  // We'll iterate through languages and check if keywords exist as whole words or specific markers
  for (const { keywords, language } of CONCEPT_TO_LANGUAGE) {
    if (keywords.some((kw) => {
      // If keyword is short or potentially a substring of others, use word boundaries
      if (kw === "java" || kw === "js" || kw === "ts" || kw === "go") {
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        return regex.test(lower);
      }
      return lower.includes(kw);
    })) {
      return language;
    }
  }
  
  return null;
}

const LANGUAGE_FUNCTION_STYLES: Record<SupportedLanguage, string> = {
  javascript: "a JavaScript function (function keyword or arrow function)",
  typescript: "a TypeScript function with proper type annotations",
  python: "a Python function using def keyword",
  java: "a Java static method inside a class (no package declaration needed, just the class)",
  cpp: "a C++ function (may include a simple main or standalone function)",
  go: "a Go function (include package main and import if needed)",
  rust: "a Rust function (include fn keyword, add main if needed to demonstrate)",
  csharp: "a C# static method inside a class",
};

const VALIDATION_KEYWORDS: Record<SupportedLanguage, string[]> = {
  javascript: ["function", "=>", "const ", "let ", "var "],
  typescript: ["function", "=>", "const ", "let ", ": string", ": number", ": boolean"],
  python: ["def ", "return", ":", "    "],
  java: ["class ", "public ", "void ", "static ", "return"],
  cpp: ["int ", "void ", "return", "{", "#include"],
  go: ["func ", "package", "return", "{"],
  rust: ["fn ", "let ", "->", "{"],
  csharp: ["class ", "static ", "void ", "public ", "return"],
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { concept, difficulty, language: requestedLang } = SeedRequestSchema.parse(body);

    // Prioritize detection, fallback to requested, then default
    let language: SupportedLanguage = "javascript";
    const detected = detectLanguage(concept);
    
    if (detected) {
      language = detected;
    } else if (requestedLang && Object.keys(LANGUAGE_FUNCTION_STYLES).includes(requestedLang)) {
      language = requestedLang as SupportedLanguage;
    }

    const style = LANGUAGE_FUNCTION_STYLES[language];

    const systemPrompt = `You are a coding educator. Generate a SINGLE self-contained code snippet in ${language.toUpperCase()} that is pedagogically designed to expose the full complexity of "${concept}" at ${difficulty} level.

Requirements:
- Write ${style}
- 15-40 lines long  
- Must demonstrate the concept "${concept}" clearly and specifically
- Use real-world naming (not foo/bar)  
- NO inline comments (student must figure it out)
- Include at least one non-obvious edge case or behaviour
- The code must be SYNTACTICALLY CORRECT ${language.toUpperCase()}
- Return ONLY the raw code. No markdown, no explanation, no backticks.`;

    const rawResponse = await callAI({
      task: "lineExplanation",
      messages: [{ role: "system", content: systemPrompt }],
      temperature: 0.8,
      maxTokens: 2000,
    });

    // Strip markdown fences if AI wraps them
    let code = rawResponse.trim();
    const fenceMatch = code.match(/^```(?:\w+)?\n([\s\S]*?)```$/);
    if (fenceMatch) code = fenceMatch[1]!.trim();

    // Validate that generated code contains language-appropriate keywords
    const validKeywords = VALIDATION_KEYWORDS[language];
    const isValid = validKeywords.some((kw) => code.includes(kw));
    if (!code || !isValid) {
      throw new Error(`Invalid ${language} code generated — missing expected syntax markers`);
    }

    return NextResponse.json({ code, language });
  } catch (error) {
    console.error("Seed generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate seed project" },
      { status: 500 }
    );
  }
}

