import { createOpenAI } from "@ai-sdk/openai";
import { Output, streamText, type ModelMessage } from "ai";
import { z } from "zod";

export const hintSchema = z.object({
  isMathProblem: z.boolean().describe("false when the input is not a math problem (gibberish, a non-math question, or an unrelated image); true otherwise"),
  topic: z.string().describe("Short name of the problem's main area, e.g. 'Number Theory'"),
  concepts: z.array(z.string()).describe("2-5 key concepts needed to solve it"),
  gimmick: z.string().describe("The single clever trick / gimmick that cracks the problem, in one sentence, without giving the answer"),
  hints: z
    .array(z.string())
    .describe("Exactly 4 progressive hints, from a gentle nudge to nearly the full solution path. Never state the final answer."),
  answer: z.string().describe("The final answer only"),
  difficulty: z
    .number()
    .int()
    .min(1)
    .max(5)
    .describe("Contest difficulty 1-5: 1 very easy (early AMC 8/10), 2 easy, 3 medium (late AMC 10/12, early AIME), 4 hard (mid/late AIME), 5 very hard (olympiad)"),
});

export type HintResult = z.infer<typeof hintSchema>;

const INSTRUCTIONS = `You are Gimmick Gecko, a friendly pixel gecko who coaches students on math contest problems (AMC, AIME, olympiads).
Given a problem (text and/or image), produce:
- the main topic,
- the key concepts needed,
- the "gimmick": the clever trick that makes it click (don't reveal the answer),
- exactly 4 progressive hints: hint 1 a gentle nudge, hint 4 almost the whole path. Each hint 1-3 sentences, plain text math (use ^ for powers, sqrt() etc.). Never put the final answer in hints,
- the final answer,
- a difficulty rating from 1 (very easy) to 5 (very hard).
For concepts, reuse names from this list whenever they fit, so practice is grouped consistently; only invent a new short name if none fit:
{{CONCEPTS}}
Be encouraging and concise. If the input is not a math problem, set isMathProblem to false and fill the other fields with short placeholders; otherwise set it to true.`;

export async function generateHints(input: { problem: string; imageDataUrl?: string | undefined }, knownConcepts: string[] = []): Promise<HintResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured.");
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });

  const content: Array<{ type: "text"; text: string } | { type: "image"; image: URL }> = [
    { type: "text", text: input.problem.trim() || "Solve the problem shown in the image." },
  ];
  if (input.imageDataUrl) content.push({ type: "image", image: new URL(input.imageDataUrl) });
  const messages: ModelMessage[] = [{ role: "user", content }];

  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    instructions: INSTRUCTIONS.replace("{{CONCEPTS}}", knownConcepts.join(", ") || "(none yet)"),
    messages,
    output: Output.object({ schema: hintSchema }),
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "medium",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  return (await result.output) as HintResult;
}
