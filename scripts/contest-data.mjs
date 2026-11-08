/** Prepare and explicitly import the permissioned contest package. No page-load writes. */
import { readFile, writeFile, mkdir, readdir, copyFile } from "node:fs/promises";
import { resolve, join, relative } from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { tutoringRecordSchema } from "../src/lib/tutoring.ts";

const json = async (path) => JSON.parse(await readFile(path, "utf8"));
const lines = async (path) =>
  (await readFile(path, "utf8"))
    .split(/\r?\n/)
    .filter(Boolean)
    .map((s) => JSON.parse(s));
const save = (path, value) => writeFile(path, JSON.stringify(value));
const normalized = (s) =>
  s
    .normalize("NFKC")
    .replace(/\$|\\[()[\]]|\s+/g, "")
    .toLowerCase();
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

/** Reuse an existing ID only when text and contest identity agree unambiguously. */
export function planRows(rows, existing) {
  const identity = (p) =>
    `${p.contest.toLowerCase()}|${p.year}|${p.problem_number}|${normalized(p.statement)}`;
  const byIdentity = new Map();
  const byId = new Map(existing.map((p) => [p.id, p]));
  for (const p of existing)
    byIdentity.set(identity(p), [...(byIdentity.get(identity(p)) ?? []), p]);
  const ids = new Set();
  const mapping = {};
  const inserts = [];
  const conflicts = [];
  let preserved = 0;
  for (const row of rows) {
    if (
      !uuid.test(row.id) ||
      !row.statement?.trim() ||
      row.difficulty < 1 ||
      row.difficulty > 5 ||
      !Array.isArray(row.concepts)
    )
      throw new Error(`Invalid import row ${row.id}`);
    if (ids.has(row.id)) throw new Error(`Duplicate import ID ${row.id}`);
    ids.add(row.id);
    const exactId = byId.get(row.id);
    const matches = byIdentity.get(identity(row)) ?? [];
    if (exactId && identity(exactId) !== identity(row)) throw new Error(`ID collision: ${row.id}`);
    if (matches.length > 1) {
      conflicts.push(row.id);
      continue;
    }
    const prior = exactId ?? matches[0];
    mapping[row.id] = prior?.id ?? row.id;
    if (prior) preserved++;
    else inserts.push(row);
  }
  return { inserts, mapping, conflicts, preserved };
}

export async function prepare(source, out, existing = []) {
  source = resolve(source);
  out = resolve(out);
  if (out === source || !relative(source, out).startsWith(".."))
    throw new Error("Output must be outside the source package.");
  const manifest = await json(join(source, "manifest.json"));
  if (manifest.format !== "gimmick-gecko-lovable-package" || manifest.schema_version !== 2)
    throw new Error("Unsupported package format");
  // Validate every declared source file before trusting content or asset paths.
  for (const [path, entry] of Object.entries(manifest.files)) {
    if (path.includes("..") || path.startsWith("/") || path.includes("\\"))
      throw new Error("Unsafe package path");
    const bytes = await readFile(join(source, path));
    if (
      bytes.length !== entry.bytes ||
      createHash("sha256").update(bytes).digest("hex") !== entry.sha256
    )
      throw new Error(`Package checksum failed: ${path}`);
  }
  const rows = await lines(join(source, "import/current_problems_rows.jsonl"));
  const catalog = await json(join(source, "catalog.json"));
  const tutoring = new Map(
    (await lines(join(source, "server_only/tutoring.jsonl"))).map((p) => [p.source_id, p]),
  );
  const assets = new Map((await json(join(source, "assets/index.json"))).map((a) => [a.id, a]));
  const plan = planRows(rows, existing);
  const sourceToId = new Map(
    catalog
      .filter((c) => plan.mapping[c.candidate_app_uuid])
      .map((c) => [c.id, plan.mapping[c.candidate_app_uuid]]),
  );
  const bySource = new Map(catalog.map((c) => [c.id, c]));
  const shards = new Map();
  const copied = new Set();
  const report = {
    indexed: rows.length,
    insert: plan.inserts.length,
    preserved: plan.preserved,
    conflicts: plan.conflicts,
    organizations: {},
    assets: 0,
    sourceSolutions: 0,
    checkable: 0,
  };
  await mkdir(join(out, "tutoring"), { recursive: true });
  await mkdir(join(out, "assets"), { recursive: true });
  const detailsDir = join(source, "problem_details");
  for (const file of (await readdir(detailsDir)).filter((f) => f.endsWith(".jsonl")).sort()) {
    for (const p of await lines(join(detailsDir, file))) {
      const id = sourceToId.get(p.id);
      if (!id) continue;
      const tutor = tutoring.get(p.id);
      const images = [];
      for (const occurrence of p.images ?? []) {
        const asset = assets.get(occurrence.media_id);
        if (!asset || !/^assets\/[a-f0-9]{64}\.(svg|webp|png|jpe?g|gif)$/.test(asset.path))
          continue;
        const angle = occurrence.render_style?.match(/rotate\(\s*(-?\d+(?:\.\d+)?)deg\)/)?.[1];
        images.push({
          path: asset.path,
          alt: occurrence.alt || "",
          ...(angle ? { rotation: Number(angle) } : {}),
        });
        if (!copied.has(asset.path)) {
          await copyFile(join(source, asset.path), join(out, asset.path));
          copied.add(asset.path);
        }
      }
      const record = {
        sourceId: p.id,
        organization: p.organization,
        contest: p.contest,
        sourceUrl: p.statement_source?.url ?? null,
        sourcePages: p.statement_source?.pages ?? [],
        style: [
          ...new Set(
            [
              p.problem_style?.response_format,
              p.round,
              p.version,
              p.division,
              ...(p.problem_style?.tags ?? []),
            ].filter((s) => s && !["main", "unspecified", "shared-or-unspecified"].includes(s)),
          ),
        ],
        estimated: true,
        images,
        visualContext: images
          .map((i) => i.alt)
          .filter(Boolean)
          .join("\n"),
        visualRequired: !!bySource.get(p.id)?.has_visual_source,
        related: (p.related_problems ?? []).slice(0, 6).flatMap((r) => {
          const related = bySource.get(r.problem_id);
          const relatedId = sourceToId.get(r.problem_id);
          return related && relatedId
            ? [
                {
                  id: relatedId,
                  label: `${related.contest} ${related.year} #${related.source_problem_label}`,
                  difficulty: related.difficulty,
                },
              ]
            : [];
        }),
        solutions: (tutor?.solutions ?? [])
          .filter((s) => s.text?.trim())
          .map((s) => ({ id: s.id, kind: s.kind, text: s.text, url: s.source_url ?? null })),
        defaultSolutionId: tutor?.tutor_plan?.default_solution_id ?? null,
      };
      tutoringRecordSchema.parse(record);
      const prefix = id.slice(0, 2);
      if (!shards.has(prefix)) shards.set(prefix, {});
      shards.get(prefix)[id] = record;
      report.organizations[p.organization] = (report.organizations[p.organization] ?? 0) + 1;
      if (record.solutions.length) report.sourceSolutions++;
    }
  }
  // Unsupported symbolic/structured keys remain available in the archive, not auto-graded.
  const automatic = new Map(
    catalog.map((c) => [
      c.candidate_app_uuid,
      tutoring.get(c.id)?.answer_check?.automatic_check_supported === true,
    ]),
  );
  const inserts = plan.inserts.map((row) => ({
    ...row,
    answer: automatic.get(row.id) ? row.answer : null,
  }));
  report.checkable = inserts.filter((r) => r.answer != null).length;
  report.assets = copied.size;
  for (const [prefix, records] of shards)
    await save(join(out, "tutoring", `${prefix}.json`), records);
  await save(join(out, "rows.json"), inserts);
  await save(join(out, "id-map.json"), Object.fromEntries(sourceToId));
  await save(join(out, "report.json"), report);
  await save(join(out, "provenance.json"), {
    sourceManifest: manifest,
    preparedAt: new Date().toISOString(),
    preservesExistingRows: true,
  });
  return report;
}

async function main() {
  const args = process.argv.slice(2);
  const value = (flag) => args[args.indexOf(flag) + 1];
  if (!args.includes("--source"))
    throw new Error(
      "Usage: node --env-file-if-exists=.env scripts/contest-data.mjs --source <unpacked-package> [--out .gecko-data] [--apply]",
    );
  const source = resolve(value("--source"));
  const out = resolve(args.includes("--out") ? value("--out") : ".gecko-data");
  const apply = args.includes("--apply");
  let db;
  const existing = [];
  if (apply || args.includes("--read-existing")) {
    const url = process.env.SUPABASE_URL;
    const key = apply
      ? process.env.SUPABASE_SERVICE_ROLE_KEY
      : process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key)
      throw new Error(
        "Apply needs Lovable-managed SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server. No writes were made.",
      );
    db = createClient(url, key, {
      auth: { persistSession: false },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`)
            headers.delete("Authorization");
          return fetch(input, { ...init, headers });
        },
      },
    });
    for (let start = 0; ; start += 1000) {
      const { data, error } = await db
        .from("problems")
        .select("*")
        .order("id")
        .range(start, start + 999);
      if (error) throw new Error("Cannot read existing problems; import stopped before writes.");
      existing.push(...data);
      if (data.length < 1000) break;
    }
  } else if (args.includes("--existing"))
    existing.push(...(await json(resolve(value("--existing")))));
  const report = await prepare(source, out, existing);
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", ...report }, null, 2));
  if (!apply) {
    console.log("Prepared locally. No database or storage writes were made.");
    return;
  }
  if (report.conflicts.length)
    throw new Error("Ambiguous existing IDs need review in report.json. No writes were made.");
  const bucket = process.env.GIMMICK_GECKO_STORAGE_BUCKET || "gecko-contests";
  const { data: buckets, error: listError } = await db.storage.listBuckets();
  if (listError) throw new Error("Could not inspect private storage; import stopped.");
  const prior = buckets.find((b) => b.name === bucket);
  if (prior?.public) throw new Error("The archive bucket must be private.");
  if (!prior) {
    const { error } = await db.storage.createBucket(bucket, { public: false });
    if (error) throw new Error("Could not create the private archive bucket.");
  }
  // Upload source context first. A failed upload leaves the live question bank untouched.
  for (const dir of ["assets", "tutoring"]) {
    const files = await readdir(join(out, dir));
    for (let start = 0; start < files.length; start += 8)
      await Promise.all(
        files.slice(start, start + 8).map(async (file) => {
          const contentType =
            dir === "tutoring"
              ? "application/json"
              : {
                  svg: "image/svg+xml",
                  webp: "image/webp",
                  png: "image/png",
                  jpg: "image/jpeg",
                  jpeg: "image/jpeg",
                  gif: "image/gif",
                }[file.split(".").pop()];
          const { error } = await db.storage
            .from(bucket)
            .upload(`${dir}/${file}`, await readFile(join(out, dir, file)), {
              upsert: true,
              contentType,
            });
          if (error)
            throw new Error(`Storage upload failed: ${dir}/${file}. Rerun safely to resume.`);
        }),
      );
    console.log(`Uploaded ${files.length} ${dir} files.`);
  }
  const rows = await json(join(out, "rows.json"));
  for (let start = 0; start < rows.length; start += 100) {
    const { error } = await db
      .from("problems")
      .upsert(rows.slice(start, start + 100), { onConflict: "id", ignoreDuplicates: true });
    if (error)
      throw new Error(
        `Question import failed at row ${start}; rerun to resume without overwriting existing rows.`,
      );
  }
  console.log(
    `Imported ${rows.length} questions; existing accounts, answers, attempts and help were preserved.`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
