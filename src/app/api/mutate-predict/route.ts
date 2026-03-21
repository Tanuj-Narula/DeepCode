import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/ai";
import { z } from "zod";

const MutationRequestSchema = z.object({
  original: z.string(),
  modified: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { original, modified } = MutationRequestSchema.parse(body);

    if (original === modified) {
        return NextResponse.json({ error: "Code has not been changed." }, { status: 400 });
    }

    const systemPrompt = `You are a JavaScript runtime simulator. Given the original code and a modified version, explain in plain English exactly what will change in behaviour. 
Cover: return value changes, error cases, performance implications, edge cases that break. 
Be specific and concrete. Max 150 words. Return your explanation as plain text.`;

    const userPrompt = `Original:
${original}

Modified:
${modified}`;

    const rawResponse = await callAI({
      task: "whatIf", // Groq Llama 3.3 70B for fast simulation
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.1, // Low temperature for deterministic simulation
      maxTokens: 1000,
    });

    return NextResponse.json({ explanation: rawResponse });
  } catch (error) {
    console.error("Mutation prediction error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to simulate mutation" },
      { status: 500 }
    );
  }
}
