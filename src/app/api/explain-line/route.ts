import { NextRequest, NextResponse } from "next/server";
import { callAI, parseAIResponse } from "@/lib/ai";
import { LineExplanationSchema } from "@/types/schemas";

export async function POST(req: NextRequest) {
  try {
    const { lineContent, lineNumber, functionCode, language } =
      await req.json();

    if (!lineContent || !functionCode || !language) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a patient code tutor for DeepCode AI's "Understand" mode. Your job is to explain a single line of code in the context of its surrounding function.

Explanation structure (answer ALL three):
1. what_it_does — What this specific line does in plain English. No jargon unless you define it immediately after.
2. why_this_way — Why the developer wrote it this way. What design decision does this represent? What alternative approaches exist?
3. what_breaks_if_removed — What would specifically break or change if this line were deleted or commented out. Be concrete.

Tone: Patient tutor at a whiteboard. No judgment. No "obviously" or "simply."
Return ONLY valid JSON.`;

    const userPrompt = `Language: ${language}

Full function context:
\`\`\`${language}
${functionCode}
\`\`\`

Line ${lineNumber}: \`${lineContent.trim()}\`

Explain this line. Return JSON:
{
  "what_it_does": "...",
  "why_this_way": "...",
  "what_breaks_if_removed": "..."
}`;

    const rawResponse = await callAI({
      task: "lineExplanation",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      maxTokens: 1000,
    });

    const parsed = await parseAIResponse(rawResponse, (data) =>
      LineExplanationSchema.parse(data)
    );

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Line explanation error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to explain line";

    return NextResponse.json(
      { error: `Something went wrong: ${message}` },
      { status: 500 }
    );
  }
}
