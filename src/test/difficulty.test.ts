import { describe, expect, it } from "vitest";
import { difficultyStars } from "@/lib/difficulty";

describe("difficultyStars", () => {
  it("gives one star to the easiest problems", () => {
    expect(difficultyStars(1)).toEqual({ filled: 1, empty: 4 });
  });

  it("gives five stars to the hardest problems", () => {
    expect(difficultyStars(5)).toEqual({ filled: 5, empty: 0 });
  });

  it("splits a mid rating into filled and empty stars", () => {
    expect(difficultyStars(3)).toEqual({ filled: 3, empty: 2 });
  });

  it("clamps out-of-range values onto the 1–5 scale", () => {
    expect(difficultyStars(0)).toEqual({ filled: 1, empty: 4 });
    expect(difficultyStars(9)).toEqual({ filled: 5, empty: 0 });
  });
});
