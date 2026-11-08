import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BankProblemPractice } from "@/components/BankProblemPractice";
import type { Problem } from "@/lib/problems.functions";

const mocks = vi.hoisted(() => ({
  save: vi.fn().mockResolvedValue({ ok: true }),
  fetch: vi.fn().mockResolvedValue({ ok: true, result: { gimmick: "Try factoring.", hints: ["First nudge", "Second nudge", "Third nudge", "Fourth nudge"] } }),
}));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));
vi.mock("@/lib/hints.functions", () => ({ getHints: mocks.fetch }));
vi.mock("@/lib/attempts.functions", () => ({ saveProblemHelp: mocks.save }));
vi.mock("@/components/AccountSession", () => ({ useAccount: () => ({ user: { id: "user" } }) }));
vi.mock("@/components/AnswerChecker", () => ({ AnswerChecker: () => null }));

const problem = { id: "problem", statement: "A question", answer: "1", difficulty: 3 } as Problem;
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("progressive bank hints", () => {
  it("opens without consuming a hint, then reveals exactly one hint per click", async () => {
    render(<BankProblemPractice problem={problem} hintsUsed={0} answerRevealed={false} solved={false} ready />);
    fireEvent.click(screen.getByRole("button", { name: "Get gecko hints" }));
    await screen.findByRole("button", { name: "Next hint (1/4)" });
    expect(screen.queryByText("First nudge")).not.toBeInTheDocument();
    expect(mocks.save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Next hint (1/4)" }));
    await screen.findByText("First nudge");
    expect(screen.queryByText("Second nudge")).not.toBeInTheDocument();
    expect(mocks.save).toHaveBeenLastCalledWith({ data: { problemId: "problem", hints: 1, answerRevealed: false } });
    fireEvent.click(screen.getByRole("button", { name: "Next hint (2/4)" }));
    await screen.findByText("Second nudge");
    expect(screen.queryByText("Third nudge")).not.toBeInTheDocument();
  });
  it("explains when wrong answers used up every available star", () => {
    render(<BankProblemPractice problem={problem} hintsUsed={0} answerRevealed={false} solved={false} incorrectAnswers={3} ready />);
    expect(screen.getByText(/stars available · Stars lost to wrong answers/)).toBeInTheDocument();
  });
  it("keeps the solved and answer-revealed indicators ahead of the wrong-answer one", () => {
    render(<BankProblemPractice problem={problem} hintsUsed={0} answerRevealed={false} solved incorrectAnswers={3} ready />);
    expect(screen.getByText(/stars available · Already solved/)).toBeInTheDocument();
    cleanup();
    render(<BankProblemPractice problem={problem} hintsUsed={0} answerRevealed solved={false} incorrectAnswers={3} ready />);
    expect(screen.getByText(/stars available · Answer revealed/)).toBeInTheDocument();
  });
  it("does not automatically reveal previously counted hints or charge for them twice", async () => {
    render(<BankProblemPractice problem={problem} hintsUsed={3} answerRevealed={false} solved={false} ready />);
    fireEvent.click(screen.getByRole("button", { name: "Get gecko hints" }));
    await screen.findByRole("button", { name: "Next hint (1/4)" });
    expect(screen.queryByText("Third nudge")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next hint (1/4)" }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledWith({ data: { problemId: "problem", hints: 3, answerRevealed: false } }));
    expect(screen.queryByText("Second nudge")).not.toBeInTheDocument();
  });
});