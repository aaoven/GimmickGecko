import { z } from "zod";

const assetSchema = z.object({
  path: z.string().regex(/^assets\/[a-f0-9]{64}\.(svg|webp|png|jpe?g|gif)$/),
  alt: z.string(),
  rotation: z.number().optional(),
});
export const tutoringRecordSchema = z.object({
  sourceId: z.string(),
  organization: z.string(),
  contest: z.string(),
  sourceUrl: z.string().url().nullable(),
  sourcePages: z.array(z.number()),
  style: z.array(z.string()),
  estimated: z.boolean(),
  images: z.array(assetSchema),
  visualContext: z.string(),
  visualRequired: z.boolean(),
  related: z.array(z.object({ id: z.string().uuid(), label: z.string(), difficulty: z.number() })),
  solutions: z.array(
    z.object({ id: z.string(), kind: z.string(), text: z.string(), url: z.string().nullable() }),
  ),
  defaultSolutionId: z.string().nullable(),
});
export type TutoringRecord = z.infer<typeof tutoringRecordSchema>;
export type PublicProblemDetails = Pick<
  TutoringRecord,
  | "sourceId"
  | "organization"
  | "sourceUrl"
  | "sourcePages"
  | "style"
  | "estimated"
  | "related"
  | "visualRequired"
> & {
  images: { url: string; alt: string; rotation?: number }[];
};

/** Select one complete path, preferring official work; never concatenate unrelated methods. */
export function selectSourceSolution(record: TutoringRecord) {
  const usable = record.solutions.filter((s) => s.text.trim().length >= 40);
  return (
    usable.find((s) => s.id === record.defaultSolutionId) ??
    usable.find((s) => s.kind === "official") ??
    usable[0]
  );
}

export function selectReferenceSolution(record: TutoringRecord) {
  const selected = selectSourceSolution(record);
  return selected
    ? `[${selected.kind}; ${selected.url ?? record.sourceUrl ?? "archived source"}]\n${selected.text.slice(0, 24000)}`
    : undefined;
}
