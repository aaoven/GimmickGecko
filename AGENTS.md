<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- AI hints run server-side in `src/lib/hints.server.ts` (structured output via Lovable AI Gateway), exposed through `hints.functions.ts`; keeps the AI key off the client.
- Contest problems live in the `problems` table (public read-only); the problem bank reads them via a server function.
- Curated bank expansions retain source and solution URLs in `data/` and import through database data tools, not page-load seeding; this keeps provenance reproducible without repeated writes.
- Accounts use Cloud Auth and one root AccountSession subscriber; private profiles are validated server-side and protected by owner-only RLS, with account pages under the authenticated layout.
- Bank answers are checked server-side; a database trigger scores attempts using persisted, monotonic per-user problem help. Skill totals aggregate the best score per distinct attempted problem to avoid repeat-answer inflation.
- Typed/uploaded gecko problems are saved per signed-in user in `custom_problems` (owner read-only RLS; writes only in server functions), with AI-assigned difficulty and concepts reused from the bank, and merge into the skillset breakdown; this keeps scoring server-side.
- Shared button interaction feedback and control transitions live in the global stylesheet, with reduced-motion overrides, so effects remain consistent across pages.
- Bank practice uses an inline per-question control and user-keyed server progress queries; saved help and successful attempts determine available stars, and previously solved answers return no additional award.
- Skill and recommendation reads merge persisted answer reveals as zero-score practice only for bank questions absent from attempts; this counts possible stars once without fabricated answer attempts or overwriting earned stars.
- Keep the full star-scoring explanation on the dedicated `/stars` route, linked beside the account skillset breakdown rather than from home, so guidance is available where users view their stars.
- Wrong-answer scoring uses serialized database grading (bank trigger and custom grading RPC); numeric equivalence uses a bounded mathjs expression allowlist, so deductions persist and unsafe expressions are rejected.
- Skillset concept-list expansion is local presentation state in its own component; it never changes star aggregation or recommendations.
