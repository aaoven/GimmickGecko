import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });
  it("matches the ask-the-gecko page", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/ask");

    expect(matches.at(-1)?.routeId).toBe("/ask");
  });
  it("keeps the account page under the signed-in gate", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const matches = router.matchRoutes("/account");
    expect(matches.map(match => match.routeId)).toContain("/_authenticated");
    expect(matches.at(-1)?.routeId).toBe("/_authenticated/account");
  });
  it("keeps password recovery public", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const matches = router.matchRoutes("/reset-password");
    expect(matches.map(match => match.routeId)).not.toContain("/_authenticated");
    expect(matches.at(-1)?.routeId).toBe("/reset-password");
  });
});
