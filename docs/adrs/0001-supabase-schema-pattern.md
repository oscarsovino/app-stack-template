# ADR-0001: Supabase schema pattern and column naming conventions

- **Status:** Accepted
- **Date:** 2026-04-20
- **Deciders:** Oscar Sovino
- **Context assembled from:** BookingRapaNui, Anamnesis, miAcademia, PollyFlip

## Context

Three projects built on this stack (BookingRapaNui, Anamnesis, miAcademia) each settled on Supabase schema conventions independently. They ended up 80% aligned and 20% divergent — different column suffixes (`_tx` vs `_txt`, `_no` vs `_num`), different schema layouts (`public` only vs `xxx` + `xxx_private`), different auth models (mirror table vs direct `auth.users`). Each new project rediscovers these trade-offs and picks one, usually correctly, sometimes not.

Production incidents surfaced in miAcademia (infinite RLS recursion, TOCTOU on `max_uses`, privilege escalation from permissive OR'd policies) are valuable and would have been prevented by a shared reference. They aren't in any current doc.

PollyFlip is the fourth project on this stack and the forcing function: we either document the pattern now or it drifts again.

## Decision

Publish `SUPABASE.md` at the root of `app-stack-template`. Propagate to every target project via `init-app-stack.sh`. Authoritative source for:

1. **Schema organization.** Single `xxx` schema is default for new apps. Split `xxx` + `xxx_private` is opt-in when the project anticipates many SECURITY DEFINER helpers or wants a clean "bypass RLS" boundary.
2. **Column naming suffixes.** Strict table of allowed suffixes (`_id`, `_name`, `_txt`, `_desc`, `_cd`, `_slug`, `_url`, `_dttm`, `_dt`, `_num`, `_qty`, `_pct`, `_rate`, `_amt`, `_json`/`_jsonb`, `_sec`/`_min`/`_ms`). Legacy suffixes `_tx` and `_no` are tolerated in BookingRapaNui but banned in new projects. When a new concept has no matching suffix, **escalate** — do not invent locally.
3. **Boolean prefixes.** `is_`, `has_`, `can_`, `should_`. No `_flg` or `_bool` suffixes.
4. **Audit columns.** `create_dttm` + `update_dttm` mandatory, maintained by trigger. Soft-delete uses `archived_at` when needed.
5. **Migration conventions.** Timestamp-prefix filenames, idempotency patterns (`DO $$` for enums, `DROP IF EXISTS + CREATE` for policies, `CREATE IF NOT EXISTS` for tables), grouping by logical unit.
6. **RLS.** Baseline policies plus documented gotchas: infinite recursion (fix with SECURITY DEFINER helpers), TOCTOU on counters (fix with atomic RPCs), permissive-OR escalation (fix by splitting `FOR ALL` into explicit `FOR SELECT/UPDATE/DELETE`).
7. **Auth model.** Profiles mirror table, trigger `handle_new_user` with an app-scoped name, no FK JOINs to `auth.users`.
8. **Type generation.** `supabase gen types typescript --schema <name>` → `packages/shared-types/src/<name>.ts`. Never hand-edited, committed to git.
9. **Service signature.** Recap of SPEC §4.3: `(client, args) => Promise<Result>`, no classes, no ORM, `.limit()` mandatory on list queries.

## Consequences

### Positive

- New projects bootstrapped from the template get conventions for free.
- Cross-project agents (Claude, Codex) can cite a single authoritative reference instead of guessing from a specific project's CLAUDE.md.
- Future projects inherit miAcademia's hard-won RLS lessons without re-discovering them.
- The suffix escalation rule ("do not invent, open a PR against the template") keeps the convention stable across the portfolio.

### Negative

- BookingRapaNui stays on the legacy `_tx`/`_no` suffixes. No retroactive migration planned. Cross-project search-and-replace work is off the table — projects define their own vocabulary, and a schema-wide rename is a breaking change.
- The template now owns opinion on subjects (single vs split schema, exact column suffix) that were previously left to each project. Any change to the convention is a template PR, not a project PR — slower but more durable.

### Neutral

- `SUPABASE.md` gets copied into each project by `init-app-stack.sh`. Projects must re-run `init-app-stack.sh --force` to pick up template updates to the conventions. The CLAUDE.md block (marker-driven) automatically refreshes; `SUPABASE.md` is treated as a skippable file — overwritten only with `--force`.

## Alternatives considered

1. **Document inside `SPEC.md`.** Rejected — would triple the length of SPEC.md. Separation of concerns: SPEC.md = stack and packages, SUPABASE.md = database conventions.
2. **Leave conventions at the project level (status quo).** Rejected — PollyFlip would be the fourth project to re-derive the pattern.
3. **Write an MCP server that serves conventions to agents.** Rejected for now (matches AI-Factory-v2 Level 3 ambition, not Level 1). Re-evaluate if we build 10+ projects.
4. **Keep BookingRapaNui's `_tx`/`_no` as the canonical suffixes.** Rejected — miAcademia and the PollyFlip lead prefer three-letter suffixes (`_txt`, `_num`) for readability. Divergence is already permanent in BookingRapaNui; new convention applies going forward.

## References

- Template: `app-stack-template/SUPABASE.md`
- BookingRapaNui convention doc: `bookingRapaNui/docs/referencias/04_modelo_de_datos_y_apis.md`
- miAcademia RLS recursion fix: `miAcademia/supabase/migrations/20251125000003_fix_recursive_rls.sql`
- miAcademia technical debt log (TOCTOU, permissive OR): `miAcademia/docs/TECHNICAL_DEBT.md`
