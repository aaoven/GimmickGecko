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
