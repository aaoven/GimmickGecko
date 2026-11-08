import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnswerChecker } from "@/components/AnswerChecker";

vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));
vi.mock("@/components/AccountSession", () => ({ useAccount: () => ({ user: null }) }));
vi.mock("@/lib/attempts.functions", () => ({ recordAttempt: vi.fn() }));
vi.mock("@/lib/hints.functions", () => ({ checkCustomAnswer: vi.fn() }));

afterEach(cleanup);

describe("math keyboard", () => {
  it("expands and collapses with the toggle button", () => {
    render(<AnswerChecker answer="1" />);
    expect(screen.queryByRole("group", { name: "Math symbols" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show math symbols keyboard" }));
    expect(screen.getByRole("group", { name: "Math symbols" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hide math symbols keyboard" }));
    expect(screen.queryByRole("group", { name: "Math symbols" })).not.toBeInTheDocument();
  });

  it("inserts a symbol at the cursor position", () => {
    render(<AnswerChecker answer="1" />);
    const input = screen.getByLabelText("Your answer") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "2+" } });
    input.setSelectionRange(1, 1);
    fireEvent.click(screen.getByRole("button", { name: "Show math symbols keyboard" }));
    fireEvent.click(screen.getByRole("button", { name: "Insert square root" }));
    expect(input.value).toBe("2\\sqrt{}+");
  });

  it("places the cursor inside the inserted fraction braces", async () => {
    render(<AnswerChecker answer="1" />);
    const input = screen.getByLabelText("Your answer") as HTMLInputElement;
    fireEvent.click(screen.getByRole("button", { name: "Show math symbols keyboard" }));
    fireEvent.click(screen.getByRole("button", { name: "Insert fraction" }));
    expect(input.value).toBe("\\frac{}{}");
    await waitFor(() => expect(input.selectionStart).toBe(6));
  });

  it("renders the typed expression as proper math notation", () => {
    render(<AnswerChecker answer="1" />);
    fireEvent.change(screen.getByLabelText("Your answer"), { target: { value: "\\frac{1}{2}" } });
    expect(document.querySelector(".katex")).not.toBeNull();
  });
});
