# Importing the combined contest bank

The app uses one shared `problems` table. General learning includes every contest;
selecting a contest narrows that pool. Statements are paginated in groups of 24.
Source solutions, diagram occurrences, contest styles, and related questions live
in a **private** Supabase Storage bucket, `gecko-contests`. No schema changes are
needed, and nothing seeds the database when someone opens a page.

## Team handoff

Use branch `codex/combined-bank-integration` from this repository and the existing
`gimmick-gecko-lovable.zip` data handoff. Extract the ZIP outside the repository.
The large archive is deliberately not committed to GitHub. Do not use the older
CEMC-only `gimmick-gecko-database.json` for this import.

With Node 24 and the repository dependencies installed, prepare and validate the
package locally:

```sh
node scripts/contest-data.mjs --source /path/to/extracted-package --out .gecko-data
```

This verifies every manifest checksum, validates every tutoring record, prepares
UUID-prefix shards, and copies only question images into the runtime package.
It makes **no database or storage writes**. Review `.gecko-data/report.json`.

To also read the existing public bank and check UUID preservation, use the local
Lovable-provided public connection variables:

```sh
node --env-file-if-exists=.env scripts/contest-data.mjs --source /path/to/extracted-package --read-existing
```

The checked-in tests cover preserved IDs and answers, ambiguous matches, duplicate
UUIDs, and conflicting IDs:

```sh
node --test scripts/contest-data.test.mjs
```

## Run the live import once

Run the following in a **trusted server environment** with Lovable-managed
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` available. The published frontend
key cannot perform this operation. Keep the service credential in managed secrets.
The normal app server also needs this credential to read the private tutoring
archive. `LOVABLE_API_KEY` is required for AI hints and photo transcription.

```sh
node --env-file-if-exists=.env scripts/contest-data.mjs --source /path/to/extracted-package --apply
```

Apply first rereads the existing bank. It reuses an existing UUID only for an
unambiguous match of contest, year, question number, and normalized statement.
Existing question rows, answer keys, accounts, attempts, and help records are
never overwritten. Ambiguous matches stop the import before remote writes.
Distinct versions remain distinct even when their question numbers agree.

The importer checks that the archive bucket is private, uploads question images
and tutoring shards, then inserts new questions in batches. Rerunning after an
interruption skips existing question IDs. If questions are imported while another
teammate is editing the bank, pause those edits during the import to keep its
identity snapshot consistent. Keep the original ZIP as the full provenance and
source-PDF archive; the runtime package does not need every original PDF.

Optional: set `GIMMICK_GECKO_STORAGE_BUCKET` consistently for both importer and app
if using a different private bucket name. Runtime source records cache for five
minutes; filter counts cache for one minute. Refresh the problem bank after import.

## Verified preparation on November 7, 2026

- 11,705 indexed questions: CEMC 2,189; MAA 6,500; CMS 768; **BC Math Challengers** 2,248.
- 9,160 questions have stored source solution text; not every source contains a
  complete worked explanation. The tutor selects one source path, preferring the
  package's designated solution, then official work.
- 1,905 distinct question image files are copied into runtime storage. Other
  images and 235 source PDFs remain in the full handoff archive. PDF-only diagrams
  link to their source; they are not silently reconstructed.
- 9,351 imported rows have supported non-null automatic answer keys in a fresh
  bank. Unsupported symbolic/structured responses remain available in the source
  archive and are not automatically graded.
- A read-only dry run against the current 32-row bank reused six IDs and planned
  11,699 new rows without conflicts. Other existing questions remain untouched;
  differences in wording or contest naming can leave overlapping questions.

These are preparation results, **not confirmation of a live import**. The local
workspace has no service credential, so the live import has not been run.

## Tutoring behavior and limits

Pasted questions and photos first attempt conservative bank retrieval. Photo
transcription uses the same server-only Lovable AI gateway as hints. Numerical
disagreement, short generic input, and ambiguous matches abstain. Candidate
retrieval is bounded, so this is not exhaustive OCR identification. Unmatched
questions use AI coaching and are labeled accordingly.

Bank requests load the saved statement and key rather than trusting client text.
Hints follow one stored source solution when available; otherwise the UI says
that the reasoning is generated. A generated answer that disagrees with the
saved key is rejected. Matching an answer key does not prove every hint correct.
Four hints are revealed progressively; the gimmick is an explicit gecko click.

Diagrams retain occurrence rotation and white backgrounds. Source excerpts are
treated as data, not instructions. Private solution text is not returned by the
public question-details function. After revealing an answer, learners can request
the selected worked source solution separately. Difficulty, topic, and similarity labels are
estimates, not official contest ratings or guarantees of a shared solution.

The user reported permission for the requested questions, official solutions and
diagrams. The original package preserves publisher and solution provenance;
unofficial solutions are distinguished from official ones.

## Lovable handoff prompt

> Use the code from `codex/combined-bank-integration`. Import the attached combined
> `gimmick-gecko-lovable.zip` using `scripts/contest-data.mjs` in a trusted backend
> environment with managed server credentials. Run the dry run, inspect its report,
> then run `--apply`. Use the existing problems table and private gecko-contests
> storage bucket. Preserve existing UUIDs, account progress, and answer keys. Keep
> service credentials and the AI gateway key on the server. Follow the verification
> steps in docs/CONTEST_DATA.md before publishing.
