import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SkillsetBreakdown } from "@/components/SkillsetBreakdown";

const stats = Array.from({ length: 12 }, (_, i) => ({ concept: `Concept ${i + 1}`, earned: i, possible: 15, problems: 3 }));
afterEach(cleanup);

describe("skillset concept limit", () => {
  it("shows eight concepts initially, expands all, and collapses back to eight", () => {
    render(<SkillsetBreakdown stats={stats} />);
    const list = screen.getByRole("list", { name: "Concept star totals" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(8);
    fireEvent.click(screen.getByRole("button", { name: "Show more" }));
    expect(within(list).getAllByRole("listitem")).toHaveLength(12);
    fireEvent.click(screen.getByRole("button", { name: "Show less" }));
    expect(within(list).getAllByRole("listitem")).toHaveLength(8);
  });

  it("keeps eight or fewer concepts visible without an expansion control", () => {
    const { rerender } = render(<SkillsetBreakdown stats={stats.slice(0, 8)} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(8);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    rerender(<SkillsetBreakdown stats={stats.slice(0, 5)} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});