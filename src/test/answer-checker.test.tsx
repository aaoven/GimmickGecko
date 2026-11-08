import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AnswerChecker } from "@/components/AnswerChecker";

const record = vi.hoisted(() => vi.fn());
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/attempts.functions", () => ({ recordAttempt: record }));
vi.mock("@/components/AccountSession", () => ({ useAccount: () => ({ user: { id: "student" } }) }));
function setup() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AnswerChecker answer="6" problemId="3d5637a1-a72a-5fd8-8fbc-dff486ae6807" />
    </QueryClientProvider>,
  );
  fireEvent.change(screen.getByLabelText("Your answer"), { target: { value: "6" } });
  fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
}
describe("saved answer feedback", () => {
  beforeEach(() => vi.clearAllMocks());
  it("does not claim success if the server fails to save the attempt", async () => {
    record.mockRejectedValue(new Error("offline"));
    setup();
    expect(await screen.findByRole("alert")).toHaveTextContent("could not be checked or saved");
    expect(screen.queryByText(/Correct!/)).not.toBeInTheDocument();
  });
  it("uses the server verdict and awarded stars", async () => {
    record.mockResolvedValue({ correct: false, earnedStars: 0, possibleStars: 3 });
    setup();
    expect(await screen.findByRole("status")).toHaveTextContent("Not quite");
    expect(screen.queryByText(/Correct!/)).not.toBeInTheDocument();
  });
});
