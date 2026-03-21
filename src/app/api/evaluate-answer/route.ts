import { NextRequest, NextResponse } from "next/server";
import { callAI, parseAIResponse } from "@/lib/ai";
import { EvaluationSchema } from "@/types/schemas";

export async function POST(req: NextRequest) {
  try {
    const { question, code, expectedKeywords, userAnswer } = await req.json();

    if (!question || !code || !userAnswer) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a code comprehension evaluator for DeepCode AI. Your job is to evaluate whether a developer's answer demonstrates genuine understanding of a code concept.

Evaluation criteria:
- "correct" (10 points): Answer shows clear understanding of the concept. Does not need to be word-perfect — conceptual accuracy matters more than exact phrasing.
- "partial" (5 points): Answer shows some understanding but misses key aspects or contains minor inaccuracies.
- "incorrect" (0 points): Answer is wrong, vague, or does not demonstrate understanding.

Rules:
- Be fair but rigorous — the goal is genuine understanding, not memorization
- Your feedback must reference the specific parts of the user's answer that were good or lacking
- Never give generic feedback — always tie it to what the user actually wrote
- Return ONLY valid JSON`;

    const userPrompt = `Code being tested:
\`\`\`
${code}
\`\`\`

Question: ${question}

Expected concepts/keywords: ${(expectedKeywords as string[])?.join(", ") || "N/A"}

User's answer: "${userAnswer}"

Evaluate this answer. Return JSON:
{
  "correct": boolean,
  "partial": boolean,
  "score_awarded": number (10 for correct, 5 for partial, 0 for incorrect),
  "feedback": "Specific feedback referencing the user's actual answer...",
  "concept_gap": "If incorrect/partial, what specific concept the user is missing (optional)"
}`;

    const rawResponse = await callAI({
      task: "answerEvaluation",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      maxTokens: 800,
    });

    const parsed = await parseAIResponse(rawResponse, (data) =>
      EvaluationSchema.parse(data)
    );

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Evaluation error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to evaluate answer";

    return NextResponse.json(
      { error: `Something went wrong: ${message}` },
      { status: 500 }
    );
  }
}
