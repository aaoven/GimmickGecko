import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HintCoach } from "@/components/HintCoach";

const mocks = vi.hoisted(() => ({ hints: vi.fn(), help: vi.fn(), speak: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/hints.functions", () => ({ getHints: mocks.hints }));
vi.mock("@/lib/attempts.functions", () => ({ saveProblemHelp: mocks.help }));
vi.mock("@/lib/problems.functions", () => ({ getSourceSolution: vi.fn() }));
vi.mock("@/lib/stream-speech", () => ({ streamSpeech: mocks.speak }));
vi.mock("@/components/AccountSession", () => ({ useAccount: () => ({ user: null }) }));
vi.mock("@/components/AnswerChecker", () => ({
  AnswerChecker: () => <div data-testid="answer-checker">Check your answer</div>,
}));

describe("HintCoach reveal flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hints.mockResolvedValue({
      ok: true,
      result: {
        topic: "Algebra",
        concepts: ["Equations"],
        gimmick: "A carefully hidden trick",
        hints: ["First nudge", "Second nudge", "Third nudge", "Last nudge"],
        answer: "6",
      },
    });
    mocks.speak.mockResolvedValue(undefined);
  });
  it("requests the saved bank question and keeps the gimmick hidden until clicked", async () => {
    render(
      <HintCoach initialProblem="Two plus four" problemId="6b63aeda-cfea-4b52-b2d6-e54779ee3e2e" />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Ask the gecko" }));
    const button = await screen.findByRole("button", { name: /Reveal the gimmick/ });
    expect(mocks.hints).toHaveBeenCalledWith({
      data: {
        problem: "",
        problemId: "6b63aeda-cfea-4b52-b2d6-e54779ee3e2e",
        imageDataUrl: undefined,
      },
    });
    expect(screen.queryByText("A carefully hidden trick")).not.toBeInTheDocument();
    fireEvent.click(button);
    expect(screen.getByText("A carefully hidden trick")).toBeInTheDocument();
    expect(screen.queryByText("Answer: 6")).not.toBeInTheDocument();
  });
  it("lets the learner attempt an answer after the fourth hint", async () => {
    render(<HintCoach initialProblem="Two plus four" />);
    fireEvent.click(screen.getByRole("button", { name: "Ask the gecko" }));
    await screen.findByRole("button", { name: /Next hint/ });
    for (let i = 0; i < 4; i++) {
      const next = screen.getByRole("button", { name: /Next hint/ });
      fireEvent.click(next);
      await waitFor(() =>
        expect(
          screen.getByText(["First nudge", "Second nudge", "Third nudge", "Last nudge"][i]!),
        ).toBeInTheDocument(),
      );
    }
    expect(screen.queryByRole("button", { name: /Next hint/ })).not.toBeInTheDocument();
    expect(screen.getByTestId("answer-checker")).toBeInTheDocument();
    expect(screen.queryByText("Answer: 6")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reveal answer" }));
    await screen.findByText("Answer: 6");
  });
});
