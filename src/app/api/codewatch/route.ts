import { NextRequest, NextResponse } from "next/server";
import { callAI, parseAIResponse } from "@/lib/ai";
import { CodeWatchSchema } from "@/types/schemas";

export async function POST(req: NextRequest) {
  try {
    const { code, language } = await req.json();

    const systemPrompt = `You are a senior code reviewer. Analyze this function for: runtime errors, security vulnerabilities, anti-patterns, silent failure modes. 
If you find nothing significant, return { "found": false }. 
If you find something, return { "found": true, "severity": "warning" | "info", "title": string (max 8 words), "explanation": string (max 60 words), "affectedLine": number | null }. 
The affectedLine should be the relative line number inside the provided code block (1-indexed). If it applies to the whole function, use null.
Return JSON ONLY.`;

    const userPrompt = `Language: ${language}
Function:
${code}`;

    const rawResponse = await callAI({
      task: "whatIf", // Use fast Groq model
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.1,
      maxTokens: 500,
    });

    const parsed = await parseAIResponse(rawResponse, (data) => CodeWatchSchema.parse(data));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("CodeWatch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "CodeWatch analysis failed" },
      { status: 500 }
    );
  }
}
