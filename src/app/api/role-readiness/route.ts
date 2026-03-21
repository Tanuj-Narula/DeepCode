import { NextRequest, NextResponse } from "next/server";
import { callAI, parseAIResponse } from "@/lib/ai";
import { RoleReadinessSchema } from "@/data/roleReadiness";

export async function POST(req: NextRequest) {
  try {
    const { role, sessionHistory } = await req.json();

    const systemPrompt = `You are a career development coach and technical assessor. 
Analyze the provided concept mastery history and evaluate the candidate for the role: ${role}.
Scores are 0-100.
Mastered: > 85, Developing: 50-85, Weak: < 50.
Provide an overall summary from the developer's perspective.
Schema: {
  role: string,
  overallScore: number 0-100,
  conceptBreakdown: Array<{ concept: string, score: number, status: "mastered" | "developing" | "weak" }>,
  criticalGaps: string[] (top 3 critical issues),
  concreteSteps: string[] (practical actions to improve)
}`;

    const userPrompt = `Role: ${role}
Concept History:
${JSON.stringify(sessionHistory, null, 2)}`;

    const rawResponse = await callAI({
      task: "lineExplanation", // Quality model
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      maxTokens: 1000,
    });

    const parsed = await parseAIResponse(rawResponse, (data) => RoleReadinessSchema.parse(data));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Readiness error:", error);
    return NextResponse.json(
      { error: "Readiness evaluation failed" },
      { status: 500 }
    );
  }
}
