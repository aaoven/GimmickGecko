import { availableProblemStars } from "./skills";

export function remainingProblemStars(problem: { id: string; difficulty: number }, progress?: {
  help: { problem_id: string; hints_revealed: number; answer_revealed: boolean }[];
  solved: string[];
  incorrect: Record<string, number>;
}): number {
  const help = progress?.help.find((row) => row.problem_id === problem.id);
  return availableProblemStars(problem.difficulty, help?.hints_revealed ?? 0, progress?.solved.includes(problem.id) ?? false, help?.answer_revealed ?? false, progress?.incorrect[problem.id] ?? 0);
}

export function hasAvailableStars(problem: Parameters<typeof remainingProblemStars>[0], progress?: Parameters<typeof remainingProblemStars>[1]): boolean {
  return remainingProblemStars(problem, progress) > 0;
}