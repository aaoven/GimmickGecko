import { z } from "zod";

export const HINT_COUNT = 4;
export const hintSchema = z.object({
  topic: z.string().min(1),
  concepts: z.array(z.string().min(1)).min(1).max(5),
  gimmick: z.string().min(1).describe("One clever insight, without the final answer"),
  hints: z
    .array(z.string().min(1))
    .length(HINT_COUNT)
    .describe("Four progressive hints; never include the final answer"),
  answer: z.string().min(1),
});
export type HintResult = z.infer<typeof hintSchema>;

export const hintInputSchema = z
  .object({
    problem: z.string().max(5000).default(""),
    problemId: z.string().uuid().optional(),
    imageDataUrl: z
      .string()
      .max(6_000_000)
      .regex(/^data:image\/(png|jpe?g|webp|gif);base64,/)
      .optional(),
  })
  .refine(
    (input) => input.problem.trim() || input.problemId || input.imageDataUrl,
    "Add a problem or an image.",
  );
