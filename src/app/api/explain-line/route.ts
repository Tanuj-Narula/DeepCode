import { NextRequest, NextResponse } from "next/server";
import { callAI, parseAIResponse } from "@/lib/ai";
import { LineExplanationSchema } from "@/types/schemas";

export async function POST(req: NextRequest) {
  try {
    const { lineContent, lineNumber, contextLines, targetLineIndex, functionCode, language } =
      await req.json();

    if (!lineContent || !functionCode || !language) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a patient code tutor for DeepCode AI's "Understand" mode. Your job is to explain a specific line of code by looking at its immediate neighborhood and the overall function.

Explanation structure (answer ALL three):
1. what_it_does — What this specific line does in plain English. No jargon unless you define it immediately after.
2. why_this_way — Why the developer wrote it this way. What design decision does this represent? What alternative approaches exist?
3. what_breaks_if_removed — What would specifically break or change if this line were deleted or commented out. Be concrete.

Tone: Patient tutor at a whiteboard. No judgment. No "obviously" or "simply."
Return ONLY valid JSON.`;

    const neighborhood = contextLines.map((line: string, i: number) => 
      i === targetLineIndex ? `==> ${line}` : `    ${line}`
    ).join("\n");

    const userPrompt = `Language: ${language}

Immediate Context (Target line marked with ==>):
\`\`\`${language}
${neighborhood}
\`\`\`

Full Function for Context:
\`\`\`${language}
${functionCode}
\`\`\`

Explain the line marked with ==> (Line ${lineNumber} in original file). Return JSON:
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
