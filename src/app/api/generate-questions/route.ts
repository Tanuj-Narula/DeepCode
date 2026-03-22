import { NextRequest, NextResponse } from "next/server";
import { callAI, parseAIResponse } from "@/lib/ai";
import { QuestionSchema } from "@/types/schemas";

export async function POST(req: NextRequest) {
  try {
    const { code, language } = await req.json();

    if (!code || !language) {
      return NextResponse.json(
        { error: "Missing required fields: code, language" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert code examiner for DeepCode AI. Your job is to generate exactly 3 questions that test whether a developer truly understands a specific piece of code.

Rules:
- Questions must be SPECIFIC to the provided code — never generic CS questions
- Each question MUST test a DIFFERENT concept — ensure all three concept_tags are distinct
- Each question tests a different depth of understanding
- Return ONLY valid JSON, no other text

Question types:
1. "surface" — What does this code do? (tests reading comprehension)
2. "conceptual" — Why is it written this way? (tests design understanding)
3. "edge_case" — What would happen if...? (tests edge case awareness)

For each question, include:
- concept_tag: the underlying CS concept (e.g., "async_await", "error_handling", "destructuring", "closures")
- expected_keywords: 3-5 keywords a correct answer should mention`;

    const userPrompt = `Language: ${language}

Code to generate questions for:
\`\`\`${language}
${code}
\`\`\`

Generate exactly 3 questions. Return JSON matching this structure:
{
  "questions": [
    {
      "question": "...",
      "difficulty": "surface",
      "concept_tag": "...",
      "expected_keywords": ["keyword1", "keyword2", "keyword3"]
    },
    {
      "question": "...",
      "difficulty": "conceptual",
      "concept_tag": "...",
      "expected_keywords": ["keyword1", "keyword2", "keyword3"]
    },
    {
      "question": "...",
      "difficulty": "edge_case",
      "concept_tag": "...",
      "expected_keywords": ["keyword1", "keyword2", "keyword3"]
    }
  ]
}`;

    const rawResponse = await callAI({
      task: "questionGeneration",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      maxTokens: 1500,
    });

    const parsed = await parseAIResponse(rawResponse, (data) =>
      QuestionSchema.parse(data)
    );

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Question generation error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to generate questions";

    return NextResponse.json(
      { error: `Something went wrong: ${message}` },
      { status: 500 }
    );
  }
}
