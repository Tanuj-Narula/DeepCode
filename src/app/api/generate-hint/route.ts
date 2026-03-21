import { NextRequest, NextResponse } from "next/server";
import { callAI, parseAIResponse, type AITask } from "@/lib/ai";
import { HintSchema } from "@/types/schemas";

export async function POST(req: NextRequest) {
  try {
    const { question, code, userAnswer, hintLevel, previousHints } =
      await req.json();

    if (!question || !code || !hintLevel) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const hintLevelNum = Number(hintLevel) as 1 | 2 | 3;

    const hintDescriptions: Record<number, string> = {
      1: `HINT LEVEL 1 — Directional Nudge:
Point the developer toward the right concept WITHOUT revealing the answer.
Think of it as saying "look over there" without saying what they'll find.
Be brief (1-2 sentences). Reference something specific in the code.`,

      2: `HINT LEVEL 2 — Analogy:
Create a real-world analogy that maps to what this specific code does.
The analogy must be specific to THIS code, not a generic CS analogy.
Example quality level: "This is like a post office that confirms delivery — fetch() checks arrival, not acceptance."`,

      3: `HINT LEVEL 3 — Full Explanation:
Give the complete, correct answer with reasoning.
Explain step by step what the code does and why.
Reference specific lines and patterns in the code.
This is the "teaching moment" — be thorough but clear.`,
    };

    const taskMapping: Record<number, AITask> = {
      1: "hint1",
      2: "hint2",
      3: "hint3",
    };

    const systemPrompt = `You are a code tutor for DeepCode AI. You are providing a hint to help a developer understand code they got wrong.

${hintDescriptions[hintLevelNum] || hintDescriptions[1]}

Rules:
- Never be condescending
- Reference the specific code being discussed
- Return ONLY valid JSON`;

    const userPrompt = `Code:
\`\`\`
${code}
\`\`\`

Question they got wrong: ${question}

Their incorrect answer: "${userAnswer || "No answer provided"}"

${previousHints?.length ? `Previous hints already shown:\n${(previousHints as string[]).map((h: string, i: number) => `Hint ${i + 1}: ${h}`).join("\n")}` : ""}

Generate a Level ${hintLevelNum} hint. Return JSON:
{
  "hint_text": "Your hint here...",
  "hint_level": ${hintLevelNum}
}`;

    const rawResponse = await callAI({
      task: taskMapping[hintLevelNum] || "hint1",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      maxTokens: hintLevelNum === 3 ? 1000 : 400,
    });

    const parsed = await parseAIResponse(rawResponse, (data) =>
      HintSchema.parse(data)
    );

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Hint generation error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to generate hint";

    return NextResponse.json(
      { error: `Something went wrong: ${message}` },
      { status: 500 }
    );
  }
}
