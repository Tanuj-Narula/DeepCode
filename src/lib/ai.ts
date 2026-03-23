/**
 * AI Provider Routing Layer
 *
 * Primary: Groq (free tier — llama-3.3-70b-versatile, llama-3.1-8b-instant)
 * Fallback: Google Gemini Flash (free tier — gemini-2.0-flash)
 */

// Model assignments by task — all on Groq free tier
export const AI_MODELS = {
  questionGeneration: "llama-3.3-70b-versatile",
  answerEvaluation: "llama-3.3-70b-versatile",
  lineExplanation: "llama-3.3-70b-versatile",
  hint1: "llama-3.1-8b-instant",
  hint2: "llama-3.1-8b-instant",
  hint3: "llama-3.3-70b-versatile",
  walkthrough: "llama-3.3-70b-versatile",
  whatIf: "llama-3.1-8b-instant",
  rubberDuck: "llama-3.3-70b-versatile",
  conceptGraph: "llama-3.3-70b-versatile",
} as const;

export type AITask = keyof typeof AI_MODELS;

interface AICallOptions {
  task: AITask;
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Makes an AI call via Groq with automatic Gemini fallback.
 * This runs server-side only (in API routes).
 */
export async function callAI({
  task,
  messages,
  temperature = 0.7,
  maxTokens = 2000,
}: AICallOptions): Promise<string> {
  const groqKeys = [
    process.env.GROQ_API_KEY?.trim(),
    process.env.GROQ_API_KEY_SECONDARY?.trim(),
  ].filter(Boolean) as string[];

  const geminiKeys = [
    process.env.GEMINI_API_KEY?.trim(),
    process.env.GEMINI_API_KEY_SECONDARY?.trim(),
  ].filter(Boolean) as string[];

  if (groqKeys.length === 0 && geminiKeys.length === 0) {
    throw new Error("No AI API keys configured (GROQ or GEMINI)");
  }

  const model = AI_MODELS[task];

  // 1. Try Groq keys in order
  for (const key of groqKeys) {
    try {
      return await callGroq(key, model, messages, temperature, maxTokens);
    } catch (error) {
      if (error instanceof AIRateLimitError) {
        console.warn(`Groq key rate-limited on ${model}, trying next key if available...`);
        continue;
      }
      // If it's a non-rate-limit error (e.g. invalid key), try the next key anyway
      console.error(`Groq error with key:`, error instanceof Error ? error.message : error);
      continue;
    }
  }

  // 2. Fallback to Gemini keys in order
  console.warn("All Groq keys failed or exhausted, falling back to Gemini...");
  for (const key of geminiKeys) {
    try {
      return await callGemini(key, messages, temperature, maxTokens);
    } catch (error) {
      if (error instanceof AIRateLimitError) {
        console.warn(`Gemini key rate-limited, trying next key...`);
        continue;
      }
      console.error(`Gemini error with key:`, error instanceof Error ? error.message : error);
      continue;
    }
  }

  throw new AIError("All AI providers and keys exhausted or rate-limited.");
}

async function callGroq(
  apiKey: string,
  model: string,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (response.status === 429) {
    throw new AIRateLimitError(`Groq rate limit hit on model: ${model}`);
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new AIError(`Groq request failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new AIError("Groq returned empty response");
  return content;
}

async function callGemini(
  apiKey: string,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  temperature: number,
  maxTokens: number
): Promise<string> {
  // Convert OpenAI-style messages to Gemini format
  const systemMsg = messages.find(m => m.role === "system")?.content ?? "";
  const conversationMsgs = messages.filter(m => m.role !== "system");

  const contents = conversationMsgs.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: systemMsg ? { parts: [{ text: systemMsg }] } : undefined,
      contents,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    }),
  });

  if (response.status === 429) {
    throw new AIRateLimitError("Gemini rate limit hit");
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new AIError(`Gemini request failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new AIError("Gemini returned empty response");
  return content;
}


export async function parseAIResponse<T>(
  rawResponse: string,
  parseSchema: (data: unknown) => T,
  retryFn?: () => Promise<string>
): Promise<T> {
  const attemptParse = (responseStr: string): T | null => {
    const candidates: string[] = [];

    // 1. Markdown blocks (check all, reversed order since answer is usually at the end)
    const blockMatches = Array.from(responseStr.matchAll(/```[a-z]*\s*\n([\s\S]*?)\n?\s*```/gi));
    for (let i = blockMatches.length - 1; i >= 0; i--) {
      candidates.push((blockMatches[i]?.[1] || "").trim());
    }

    // A more generic block match fallback
    const blockMatches2 = Array.from(responseStr.matchAll(/```(?:json)?\s*([\s\S]*?)\s*```/gi));
    for (let i = blockMatches2.length - 1; i >= 0; i--) {
      candidates.push((blockMatches2[i]?.[1] || "").trim());
    }

    // 2. Full response
    candidates.push(responseStr.trim());

    // 3. First `{` to last `}`
    const firstBrace = responseStr.indexOf("{");
    const lastBrace = responseStr.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      candidates.push(responseStr.substring(firstBrace, lastBrace + 1));
    }

    // 4. First `[` to last `]`
    const firstBracket = responseStr.indexOf("[");
    const lastBracket = responseStr.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1) {
      candidates.push(responseStr.substring(firstBracket, lastBracket + 1));
    }

    // 5. Last `{` starting a line to the end of the text
    const lines = responseStr.split('\n');
    let openBraceLine = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      if ((lines[i] || "").trim().startsWith('{')) {
        openBraceLine = i;
        break;
      }
    }
    if (openBraceLine !== -1) {
      candidates.push(lines.slice(openBraceLine).join('\n').trim());
    }

    // Strip out duplicates
    const uniqueCandidates = Array.from(new Set(candidates)).filter(Boolean);

    for (const candidate of uniqueCandidates) {
      try {
        const parsed = JSON.parse(candidate);
        // Important: also validate the schema so we don't return random valid JSON blocks
        return parseSchema(parsed);
      } catch (e) {
        // Continue to the next candidate
      }
    }

    return null;
  };

  const parsedData = attemptParse(rawResponse);

  if (parsedData !== null) {
    return parsedData;
  }

  console.warn("First parse attempt failed using all candidates.");

  // If we have a retry function, try once more
  if (retryFn) {
    try {
      const retryResponse = await retryFn();
      const retryParsedData = attemptParse(retryResponse);
      
      if (retryParsedData !== null) {
        return retryParsedData;
      }
      
      throw new Error("Retry parsing also failed using all candidates.");
    } catch (retryError: any) {
      console.error("Retry parse also failed:", retryError);
      throw new AIError(
        `Parse failed after retry. RetryError: ${retryError?.message}. Raw: ${rawResponse.substring(0, 500)}`
      );
    }
  }

  throw new AIError(
    `Failed to parse AI response. Raw: ${rawResponse.substring(0, 500)}`
  );
}

// ─── Custom Error Classes ───
export class AIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIError";
  }
}

export class AIRateLimitError extends AIError {
  constructor(message: string) {
    super(message);
    this.name = "AIRateLimitError";
  }
}
