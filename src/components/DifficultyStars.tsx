import { difficultyStars } from "@/lib/difficulty";

export function DifficultyStars({ value }: { value: number }) {
  const { filled, empty } = difficultyStars(value);
  return (
    <span className="text-xl leading-none text-accent" role="img" aria-label={`Difficulty: ${filled} out of 5 stars`}>
      {"★".repeat(filled)}
      <span className="text-muted">{"★".repeat(empty)}</span>
    </span>
  );
}
