import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { PAGE_SIZE, problemSearchSchema, searchWords } from "./problem-search";

export type Problem = Database["public"]["Tables"]["problems"]["Row"];

export const listProblems = createServerFn({ method: "GET" })
  .validator((input: unknown) => problemSearchSchema.parse(input))
  .handler(async ({ data }) => {
    const { publicDatabase } = await import("./public-db.server");
    let query = publicDatabase().from("problems").select("*", { count: "exact" });
    if (data.contest) query = query.eq("contest", data.contest);
    if (data.difficulty) query = query.eq("difficulty", data.difficulty);
    if (data.concepts.length) query = query.contains("concepts", data.concepts);
    for (const word of searchWords(data.query)) query = query.ilike("statement", `%${word}%`);
    const {
      data: problems,
      count,
      error,
    } = await query
      .order("year", { ascending: false })
      .order("contest")
      .order("problem_number")
      .order("id")
      .range(data.page * PAGE_SIZE, (data.page + 1) * PAGE_SIZE - 1);
    if (error) throw new Error("The problem bank could not be loaded. Try again.");
    return { problems: problems ?? [], total: count ?? 0 };
  });

export const getProblemFilters = createServerFn({ method: "GET" }).handler(async () => {
  const { bankFilters } = await import("./problems.server");
  return bankFilters();
});

export const getProblem = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { publicDatabase } = await import("./public-db.server");
    const { data: problem, error } = await publicDatabase()
      .from("problems")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error || !problem)
      throw new Error("That problem could not be found. Choose another from the bank.");
    const { publicProblemDetails } = await import("./tutoring.server");
    return { problem, details: await publicProblemDetails(data.id) };
  });

export const getSourceSolution = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { tutoringRecord } = await import("./tutoring.server");
    const { selectSourceSolution } = await import("./tutoring");
    const record = await tutoringRecord(data.id);
    const solution = record ? selectSourceSolution(record) : undefined;
    return solution ? { text: solution.text, kind: solution.kind, url: solution.url } : null;
  });
