import { createFileRoute } from "@tanstack/react-router";
import { requestSpeech } from "@/lib/speech.server";

export const Route = createFileRoute("/api/speak")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("Speech not configured", { status: 500 });
        const body = (await request.json().catch(() => null)) as { text?: unknown } | null;
        const text = typeof body?.text === "string" ? body.text.trim().slice(0, 1500) : "";
        if (!text) return new Response("Missing text", { status: 400 });
        try {
          const upstream = await requestSpeech(
            {
              baseURL: "https://ai.gateway.lovable.dev",
              apiKey,
              model: "google/gemini-3.1-flash-tts-preview",
              format: "gemini",
              voice: "Puck",
            },
            `Say in a cheerful, friendly, playful coach voice: ${text}`,
            false,
            request.signal,
          );
          return new Response(upstream.body, {
            status: upstream.status,
            headers: {
              "Content-Type": upstream.headers.get("Content-Type") ?? "text/event-stream",
              "Cache-Control": "no-cache",
            },
          });
        } catch (e) {
          if (request.signal.aborted) return new Response(null, { status: 499 });
          throw e;
        }
      },
    },
  },
});
