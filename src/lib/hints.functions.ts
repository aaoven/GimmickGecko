import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateHints } from "./hints.server";

export const getHints = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        problem: z.string().max(5000),
        imageDataUrl: z
          .string()
          .max(6_000_000)
          .regex(/^data:image\/(png|jpe?g|webp|gif);base64,/)
          .optional(),
      })
      .refine((d) => d.problem.trim() || d.imageDataUrl, "Add a problem or an image.")
      .parse(data),
  )
  .handler(async ({ data }) => {
    try {
      return { ok: true as const, result: await generateHints(data) };
    } catch (e) {
      console.error("hint generation failed", e);
      const status = (e as { statusCode?: number })?.statusCode;
      const message =
        status === 429
          ? "Gecko is busy — too many requests. Try again in a moment."
          : status === 402
            ? "AI credits ran out. Add credits in Settings → Plans & credits."
            : "Gecko couldn't read that problem. Try again.";
      return { ok: false as const, error: message };
    }
  });
