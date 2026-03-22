/**
 * AI Provider Routing Layer
 *
 * Unified interface for AI calls via OpenRouter.
 * Maps tasks to specific models per the tech stack document.
 */

// Model assignments by task
export const AI_MODELS = {
  questionGeneration: "groq/llama-3.3-70b-versatile",
  answerEvaluation: "anthropic/claude-haiku-4-5",
  lineExplanation: "anthropic/claude-haiku-4-5",
  hint1: "groq/llama-3.3-70b-versatile",
  hint2: "groq/llama-3.3-70b-versatile",
  hint3: "anthropic/claude-haiku-4-5",
  walkthrough: "anthropic/claude-haiku-4-5",
  whatIf: "groq/llama-3.3-70b-versatile",
  rubberDuck: "anthropic/claude-sonnet-4-6",
  conceptGraph: "anthropic/claude-haiku-4-5",
} as const;

// Fallback model when primary hits rate limits
export const FALLBACK_MODEL = "google/gemini-flash-2.0";

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
 * Makes an AI call via OpenRouter with automatic fallback.
 * This runs server-side only (in API routes).
 */
export async function callAI({
  task,
  messages,
  temperature = 0.7,
  maxTokens = 2000,
}: AICallOptions): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const primaryModel = AI_MODELS[task];

  // Try primary model first
  try {
    const response = await makeRequest(apiKey, primaryModel, messages, temperature, maxTokens);
    return response;
  } catch (error) {
    // On rate limit (429), fall back to Gemini Flash
    if (error instanceof AIRateLimitError) {
      console.warn(`Rate limited on ${primaryModel}, falling back to ${FALLBACK_MODEL}`);
      const response = await makeRequest(apiKey, FALLBACK_MODEL, messages, temperature, maxTokens);
      return response;
    }
    throw error;
  }
}

async function makeRequest(
  apiKey: string,
  model: string,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  temperature: number,
  maxTokens: number
): Promise<string> {
  // Feature: Direct Groq Support
  const groqApiKey = process.env.GROQ_API_KEY;
  const isDirectGroq = model.startsWith("groq/") && groqApiKey;
  
  const url = isDirectGroq 
    ? "https://api.groq.com/openai/v1/chat/completions" 
    : "https://openrouter.ai/api/v1/chat/completions";

  const authKey = isDirectGroq ? groqApiKey : apiKey;
  const targetModel = isDirectGroq ? model.replace("groq/", "") : model;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authKey}`,
      "Content-Type": "application/json",
      ...(isDirectGroq ? {} : {
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://deepcode.ai",
        "X-Title": "DeepCode AI",
      }),
    },
    body: JSON.stringify({
      model: targetModel,
      messages,
      temperature,
      max_tokens: maxTokens,
      ...(isDirectGroq ? {} : { response_format: { type: "json_object" } }),
    }),
  });

  if (response.status === 429) {
    throw new AIRateLimitError(`Rate limited on model: ${model}`);
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new AIError(`AI request failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new AIError("AI returned empty response");
  }

  return content;
}

export async function parseAIResponse<T>(
  rawResponse: string,
  parseSchema: (data: unknown) => T,
  retryFn?: () => Promise<string>
): Promise<T> {
  // Try to extract JSON from the response (AI sometimes wraps in markdown)
  let jsonString = rawResponse.trim();

  // Extract JSON block using regex if present
  const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch && jsonMatch[1]) {
    jsonString = jsonMatch[1].trim();
  } else {
    // Attempt to extract the first { ... } or [ ... ]
    const firstBrace = jsonString.indexOf("{");
    const lastBrace = jsonString.lastIndexOf("}");
    const firstBracket = jsonString.indexOf("[");
    const lastBracket = jsonString.lastIndexOf("]");

    if (
      firstBrace !== -1 &&
      lastBrace !== -1 &&
      (firstBracket === -1 || firstBrace < firstBracket)
    ) {
      jsonString = jsonString.substring(firstBrace, lastBrace + 1);
    } else if (firstBracket !== -1 && lastBracket !== -1) {
      jsonString = jsonString.substring(firstBracket, lastBracket + 1);
    }
  }

  try {
    const parsed = JSON.parse(jsonString);
    return parseSchema(parsed);
  } catch (firstError: any) {
    console.warn("First parse attempt failed:", firstError);

    const errorDetails = firstError?.message || String(firstError);

    // If we have a retry function, try once more
    if (retryFn) {
      try {
        const retryResponse = await retryFn();
        let retryJsonString = retryResponse.trim();
        const retryMatch = retryJsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (retryMatch && retryMatch[1]) {
          retryJsonString = retryMatch[1].trim();
        } else {
          const fb = retryJsonString.indexOf("{");
          const lb = retryJsonString.lastIndexOf("}");
          if (fb !== -1 && lb !== -1) {
            retryJsonString = retryJsonString.substring(fb, lb + 1);
          }
        }
        
        const retryParsed = JSON.parse(retryJsonString);
        return parseSchema(retryParsed);
      } catch (retryError: any) {
        console.error("Retry parse also failed:", retryError);
        throw new AIError(
          `Parse failed after retry. Error: ${errorDetails} / RetryError: ${retryError?.message}. Raw: ${rawResponse.substring(0, 500)}`
        );
      }
    }

    throw new AIError(
      `Failed to parse AI response. Error: ${errorDetails}. Raw: ${rawResponse.substring(0, 500)}`
    );
  }
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
