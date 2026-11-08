import { publicDatabase } from "./public-db.server";

type Filters = { contests: string[]; concepts: { name: string; count: number }[]; total: number };
let cache: { expires: number; promise: Promise<Filters> } | undefined;

export function bankFilters(): Promise<Filters> {
  if (cache && cache.expires > Date.now()) return cache.promise;
  const promise = readFilters().catch((error: unknown) => {
    cache = undefined;
    throw error;
  });
  cache = { expires: Date.now() + 60_000, promise };
  return promise;
}

async function readFilters(): Promise<Filters> {
  const contests = new Set<string>();
  const concepts = new Map<string, number>();
  let total = 0;
  for (let start = 0; ; start += 1000) {
    const { data, error } = await publicDatabase()
      .from("problems")
      .select("contest,concepts")
      .order("id")
      .range(start, start + 999);
    if (error) throw new Error("The practice filters could not be loaded.");
    for (const row of data ?? []) {
      contests.add(row.contest);
      for (const concept of new Set(row.concepts))
        concepts.set(concept, (concepts.get(concept) ?? 0) + 1);
    }
    total += data?.length ?? 0;
    if (!data || data.length < 1000) break;
  }
  return {
    total,
    contests: [...contests].sort(),
    concepts: [...concepts]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
  };
}
