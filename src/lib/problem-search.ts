import { z } from "zod";

export const problemSearchSchema = z.object({
  page: z.number().int().min(0).max(10000).default(0),
  contest: z.string().max(160).default(""),
  concepts: z.array(z.string().max(120)).max(8).default([]),
  difficulty: z.number().int().min(0).max(5).default(0),
  query: z.string().trim().max(100).default(""),
});
export type ProblemSearch = z.infer<typeof problemSearchSchema>;
export const PAGE_SIZE = 24;

/** Literal search only; don't let PostgREST operators or wildcard input broaden a search. */
export function searchWords(query: string) {
  return query
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8);
}
