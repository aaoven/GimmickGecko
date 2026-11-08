import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SourceSolution } from "@/components/SourceSolution";
const fetchSolution = vi.hoisted(() => vi.fn());
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/problems.functions", () => ({ getSourceSolution: fetchSolution }));
describe("worked source reveal", () => {
  beforeEach(() => vi.clearAllMocks());
  it("fetches only on explicit request and identifies official source work", async () => {
    fetchSolution.mockResolvedValue({
      kind: "official",
      text: "Factor the expression, then count the roots.",
      url: "https://example.org/solutions",
    });
    render(<SourceSolution problemId="3d5637a1-a72a-5fd8-8fbc-dff486ae6807" />);
    expect(fetchSolution).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Read worked source solution" }));
    expect(await screen.findByRole("heading")).toHaveTextContent("Official source solution");
    expect(screen.getByRole("link")).toHaveAttribute("href", "https://example.org/solutions");
  });
  it("handles missing worked solutions without fabricating one", async () => {
    fetchSolution.mockResolvedValue(null);
    render(<SourceSolution problemId="3d5637a1-a72a-5fd8-8fbc-dff486ae6807" />);
    fireEvent.click(screen.getByRole("button", { name: "Read worked source solution" }));
    expect(await screen.findByRole("status")).toHaveTextContent("No worked source solution");
  });
});
