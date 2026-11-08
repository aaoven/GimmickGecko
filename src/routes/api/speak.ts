import { createFileRoute } from "@tanstack/react-router";

// "George" — a warm, older British voice for the professor gecko.
const VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";

export const Route = createFileRoute("/api/speak")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["ELEVENLABS_API_KEY"];
        if (!apiKey) return new Response("Voice is not connected", { status: 500 });
        try {
          const body = (await request.json().catch(() => null)) as { text?: unknown } | null;
          const text = typeof body?.text === "string" ? body.text.trim().slice(0, 1500) : "";
          if (!text) return new Response("Missing text", { status: 400 });
          const upstream = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream?output_format=mp3_44100_128`,
            {
              method: "POST",
              headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
              body: JSON.stringify({
                text,
                model_id: "eleven_multilingual_v2",
                voice_settings: { stability: 0.65, similarity_boost: 0.75, style: 0.35, use_speaker_boost: true, speed: 0.95 },
              }),
              signal: request.signal,
            },
          );
          if (!upstream.ok) {
            const err = await upstream.text();
            console.error(`ElevenLabs failed [${upstream.status}]: ${err}`);
            return new Response(err, { status: upstream.status });
          }
          // Buffer before responding so a client disconnect can't reject mid-stream.
          const audio = await upstream.arrayBuffer();
          return new Response(audio, {
            headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-cache" },
          });
        } catch (e) {
          // Expected when the listener stops or navigates away mid-request.
          if (request.signal.aborted || (e instanceof Error && e.name === "AbortError")) {
            return new Response(null, { status: 499 });
          }
          throw e;
        }
      },
    },
  },
});
