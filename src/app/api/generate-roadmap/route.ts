import { NextRequest, NextResponse } from "next/server";
import { callAI, parseAIResponse } from "@/lib/ai";
import { RoadmapSchema } from "@/types/schemas";

export async function POST(req: NextRequest) {
  try {
    const { scores } = await req.json();

    const systemPrompt = `You are a curriculum designer. Given a developer's concept mastery scores (conceptTag -> avgScore), generate a 4-week personalised learning roadmap. 
Return JSON only matching the schema exactly.
Schema: {
  weeks: Array<{
    weekNumber: 1 | 2 | 3 | 4,
    theme: string,
    milestones: Array<{
      concept: string,
      reason: string,
      suggestedCodePattern: string
    }>
  }>
}`;

    const userPrompt = `Concept Mastery Scores:
${JSON.stringify(scores, null, 2)}

Design a roadmap that focuses on improving the lower scores while reinforcing stable ones.`;

    const rawResponse = await callAI({
      task: "lineExplanation", // High density generation
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      maxTokens: 2500,
    });

    const parsed = await parseAIResponse(rawResponse, (data) => RoadmapSchema.parse(data));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Roadmap generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate roadmap" },
      { status: 500 }
    );
  }
}
