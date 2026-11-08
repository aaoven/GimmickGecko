import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import geckoImg from "@/assets/gecko.png";
import { Toaster } from "@/components/ui/sonner";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AccountSession, useAccount } from "@/components/AccountSession";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserRound } from "lucide-react";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    // Replace these placeholders with the app's name and description when first building the app.
    // Each content route, / included, must still set its own head(). Never add og:image or
    // twitter:image here: every page without its own would inherit the root's preview image.
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Gimmick Gecko" },
      { name: "description", content: "Practice math contest problems with a pixel gecko coach." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Space+Grotesk:wght@400;500;700&family=VT323&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AccountSession>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <header className="border-b-4 border-border bg-panel">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="group flex items-center gap-3">
            <img src={geckoImg} alt="" width={40} height={40} className="pixelated h-10 w-10" />
            <span className="font-pixel text-xs text-primary sm:text-sm">Gimmick Gecko</span>
            <span className="flex items-center gap-1 font-pixel text-[9px] uppercase text-muted-foreground group-hover:text-accent">
              <ArrowLeft aria-hidden="true" className="h-4 w-4 shrink-0 text-accent" />
              Home
            </span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1 font-pixel text-[10px] uppercase">
            <Link
              to="/ask"
              className="px-3 py-2 hover:bg-secondary"
              activeProps={{ className: "bg-primary text-primary-foreground" }}
            >
              Ask the gecko
            </Link>
            <Link
              to="/problems"
              className="px-3 py-2 hover:bg-secondary"
              activeProps={{ className: "bg-primary text-primary-foreground" }}
            >
              Problems
            </Link>
            <AccountLink />
          </nav>
        </div>
      </header>
      <Outlet />
      <Toaster />
      </AccountSession>
    </QueryClientProvider>
  );
}

function AccountLink() {
  const { user, loading } = useAccount();
  return <Button asChild variant="ghost" size="sm" disabled={loading} className="font-pixel text-[10px]">
    <Link to={user ? "/account" : "/auth"}><UserRound />{user ? "Account" : "Log in"}</Link>
  </Button>;
}
