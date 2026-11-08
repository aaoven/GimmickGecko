import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HintCoach } from "@/components/HintCoach";

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  saveHelp: vi.fn(),
  saveCustom: vi.fn(),
  progress: vi.fn(),
}));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@tanstack/react-query", () => ({ useQuery: () => ({ data: undefined }) }));
vi.mock("@/lib/hints.functions", () => ({ getHints: mocks.fetch, saveCustomHelp: mocks.saveCustom }));
vi.mock("@/lib/attempts.functions", () => ({ saveProblemHelp: mocks.saveHelp, getBankProgress: mocks.progress }));
vi.mock("@/components/AccountSession", () => ({ useAccount: () => ({ user: null }) }));
vi.mock("@/components/AnswerChecker", () => ({ AnswerChecker: () => <button>Check answer</button> }));
vi.mock("@/lib/stream-speech", () => ({ streamSpeech: vi.fn() }));

const notMathResult = {
  isMathProblem: false,
  topic: "None",
  concepts: ["None"],
  gimmick: "No gimmick",
  hints: ["a", "b", "c", "d"],
  answer: "None",
  difficulty: 1,
};
const mathResult = { ...notMathResult, isMathProblem: true, topic: "Algebra", gimmick: "Factor it.", answer: "7", difficulty: 2 };

async function ask(result: typeof notMathResult) {
  mocks.fetch.mockResolvedValue({ ok: true, result, customId: null });
  render(<HintCoach />);
  fireEvent.change(screen.getByLabelText("Your problem"), { target: { value: "what is the capital of France" } });
  fireEvent.click(screen.getByRole("button", { name: "Ask the gecko" }));
  await screen.findAllByText(/not a math problem|The gimmick/);
}

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("non-math input", () => {
  it("says it can only teach math and shows no hint, reveal, or answer buttons", async () => {
    await ask(notMathResult);
    expect(screen.getAllByText(/That's not a math problem, I can only teach math!/).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /Next hint/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Reveal answer/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Check answer" })).not.toBeInTheDocument();
  });
  it("keeps the hint, reveal, and answer controls for a real math problem", async () => {
    await ask(mathResult);
    expect(screen.getByRole("button", { name: /Next hint/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reveal answer/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Check answer" })).toBeInTheDocument();
  });
});
