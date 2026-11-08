import { z } from "zod";
import { tutoringRecordSchema, type TutoringRecord, type PublicProblemDetails } from "./tutoring";

const shards = new Map<
  string,
  { expires: number; promise: Promise<Record<string, TutoringRecord>> }
>();
const bucketName = () => process.env["GIMMICK_GECKO_STORAGE_BUCKET"] || "gecko-contests";

/** Private, UUID-prefix shards keep solution archives out of browser bundles. */
export async function tutoringRecord(id: string): Promise<TutoringRecord | null> {
  if (!z.string().uuid().safeParse(id).success || !process.env["SUPABASE_SERVICE_ROLE_KEY"])
    return null;
  const prefix = id.slice(0, 2).toLowerCase();
  let cached = shards.get(prefix);
  if (!cached || cached.expires <= Date.now()) {
    const promise = (async () => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data, error } = await supabaseAdmin.storage
        .from(bucketName())
        .download(`tutoring/${prefix}.json`);
      if (error || !data) throw new Error("Source archive unavailable");
      return z.record(z.string().uuid(), tutoringRecordSchema).parse(JSON.parse(await data.text()));
    })();
    cached = { expires: Date.now() + 300_000, promise };
    if (shards.size >= 8) shards.delete(shards.keys().next().value!);
    shards.set(prefix, cached);
  }
  try {
    return (await cached.promise)[id] ?? null;
  } catch {
    shards.delete(prefix);
    return null;
  }
}

export async function publicProblemDetails(id: string): Promise<PublicProblemDetails | null> {
  const record = await tutoringRecord(id);
  if (!record) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const images = await Promise.all(
    record.images.map(async (image) => {
      const { data } = await supabaseAdmin.storage
        .from(bucketName())
        .createSignedUrl(image.path, 3600);
      return data
        ? {
            url: data.signedUrl,
            alt: image.alt,
            ...(image.rotation ? { rotation: image.rotation } : {}),
          }
        : null;
    }),
  );
  return {
    sourceId: record.sourceId,
    organization: record.organization,
    sourceUrl: record.sourceUrl,
    sourcePages: record.sourcePages,
    style: record.style,
    estimated: record.estimated,
    related: record.related,
    visualRequired: record.visualRequired,
    images: images.filter((image) => image !== null),
  };
}
