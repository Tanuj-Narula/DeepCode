import { NextRequest, NextResponse } from "next/server";
import { callAI, parseAIResponse } from "@/lib/ai";
import { WalkthroughSchema } from "@/types/schemas";

export async function POST(req: NextRequest) {
  try {
    const { code, language } = await req.json();

    if (!code || !language) {
      return NextResponse.json(
        { error: "Missing required fields: code, language" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a senior developer at a whiteboard for DeepCode AI's "Understand" mode. Your job is to walk through a function step-by-step, like you're explaining it to a colleague who is new to the codebase.

Structure your walkthrough as:
1. Purpose — One sentence: what does this function exist to do?
2. Inputs — What does it accept? What types/shapes?
3. Steps — Numbered, clear step-by-step logic. Each step references specific code.
4. Output — What does it return? What shape?
5. Edge cases — What inputs or conditions could cause unexpected behavior?

Tone: Senior dev at a whiteboard. Clear, specific, no hand-waving.
Return ONLY valid JSON.`;

    const userPrompt = `Language: ${language}

Function to walk through:
\`\`\`${language}
${code}
\`\`\`

Return JSON:
{
  "purpose": "One-sentence purpose...",
  "inputs": "Description of inputs...",
  "steps": [
    { "step_number": 1, "description": "...", "code_reference": "relevant line or snippet" },
    { "step_number": 2, "description": "...", "code_reference": "..." }
  ],
  "output": "What the function returns...",
  "edge_cases": ["Edge case 1", "Edge case 2"]
}`;

    const rawResponse = await callAI({
      task: "walkthrough",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      maxTokens: 2000,
    });

    const parsed = await parseAIResponse(rawResponse, (data) =>
      WalkthroughSchema.parse(data)
    );

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Walkthrough error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to generate walkthrough";

    return NextResponse.json(
      { error: `Something went wrong: ${message}` },
      { status: 500 }
    );
  }
}
