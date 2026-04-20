# Supabase conventions

> Version: 1.0.0
> Date: 2026-04-20
> Scope: Projects bootstrapped from `app-stack-template`.

This file is the authoritative source for Supabase schema design, naming, RLS, migrations, and type generation across every project that uses this template. SPEC.md §4.1 is a pointer; the detail lives here.

**Copied by `init-app-stack.sh` into every target project.** Edit the template copy at `app-stack-template/SUPABASE.md` — project-level edits are overwritten on the next `--force` re-init.

---

## 1. Overview

Every app backed by this template shares:

- **One Supabase project per product.** Sandbox and production are distinct projects, not distinct schemas.
- **One schema per app inside the project.** If two apps share the same Supabase project (e.g. `pollyflip` sharing a sandbox with `booking`), each gets its own schema. Client initializes with `db: { schema: "<name>" }`.
- **Migrations under `supabase/migrations/`** at the monorepo root. Single migration set, no split by app.
- **Types regenerated from schema**, never hand-edited. Output lives in `packages/shared-types/src/<schema>.ts`.

---

## 2. Schema organization

Two valid layouts. Pick one per app and stick with it.

### 2.1 Single public schema (default)

All tables and functions live in the app's main schema (e.g. `pollyflip`). RLS enforces all access control. SECURITY DEFINER functions live alongside tables.

**When to choose:** greenfield, no analytics-only views, no operator helpers that need to bypass RLS wholesale. Default for new apps.

**Example projects:** miAcademia.

### 2.2 Split public + private schemas (`xxx` + `xxx_private`)

Public schema (`pollyflip`) holds tables + views consumed by clients via PostgREST. Private schema (`pollyflip_private`) holds SECURITY DEFINER functions, triggers, and internal helpers. Only `service_role` sees `xxx_private`.

**When to choose:** you anticipate many SECURITY DEFINER helpers (billing math, refund calc, cross-tenant aggregates), OR you want to expose analytics views to operators without exposing the source tables, OR you want a clean boundary for "this is business logic that runs as superuser".

**Example projects:** BookingRapaNui, Anamnesis.

**Rule:** the private schema is NEVER added to Supabase's "Exposed schemas" list. PostgREST must not serve it.

---

## 3. Column naming conventions

Strict. If you encounter a concept that doesn't map to a suffix in this table, **escalate to the human owner** — do not invent a new suffix.

### 3.1 Type suffixes (mandatory)

| Suffix | Type (typical) | Usage | Example |
|---|---|---|---|
| `_id` | UUID | PK or FK | `user_id`, `deck_id` |
| `_name` | VARCHAR(120) | Short label (≤ 120 char) | `deck_name`, `full_name` |
| `_txt` | TEXT | Free-form prose | `question_txt`, `answer_txt` |
| `_desc` | TEXT | Description paragraph | `deck_desc`, `product_desc` |
| `_cd` | VARCHAR(32) or enum | Short code / enum value | `locale_cd`, `status_cd`, `poi_type_cd` |
| `_slug` | VARCHAR(200) | URL-safe identifier | `canonical_slug`, `public_slug` |
| `_url` | VARCHAR(500) | URL | `avatar_url`, `cover_url` |
| `_dttm` | TIMESTAMPTZ | Timestamp (with timezone) | `create_dttm`, `update_dttm`, `expire_dttm` |
| `_dt` | DATE | Calendar date, no time | `birth_dt`, `billing_dt` |
| `_num` | INTEGER | Counter, quantity, ordinal | `max_num`, `priority_num`, `installments_num` |
| `_qty` | NUMERIC(12,3) | Quantity with unit (inventory) | `stock_qty`, `serving_qty` |
| `_pct` | NUMERIC(5,2) | Percentage — **document 0–1 vs 0–100 in a column comment** | `refund_pct`, `progress_pct` |
| `_rate` | NUMERIC(6,4) | Ratio, typically 0–1 | `attendance_rate`, `conversion_rate` |
| `_amt` | NUMERIC(12,2) | Money amount | `base_amt`, `refund_amt` |
| `_json` / `_jsonb` | JSONB | JSON blob | `metadata_jsonb`, `payload_json` |
| `_sec` / `_min` / `_ms` | INTEGER | Duration in a specific unit | `timeout_sec`, `duration_min`, `latency_ms` |

**Do not use** `_tx` (legacy — BookingRapaNui), `_no` (legacy — BookingRapaNui), `_flg`, `_bool`, plain `description` / `name` without prefix, generic `value` / `data` columns.

**Legacy note:** BookingRapaNui (pre-template) uses `_tx`/`_no`. Those are tolerated in that project, not replicated in new ones. `init-app-stack.sh` does not rewrite existing columns.

### 3.2 Boolean prefixes (mandatory)

Booleans never take a suffix. They take a semantic prefix:

| Prefix | Meaning | Example |
|---|---|---|
| `is_` | State | `is_active`, `is_public`, `is_archived` |
| `has_` | Possession | `has_audio`, `has_media`, `has_children` |
| `can_` | Capability | `can_edit`, `can_invite` |
| `should_` | Policy / intent | `should_notify`, `should_resync` |

Default all booleans to `NOT NULL DEFAULT false` (or `true` if the semantic default is positive — `is_active`, `is_enabled`).

### 3.3 Audit columns (mandatory on every table)

Every table that represents user-facing state includes:

```sql
create_dttm    TIMESTAMPTZ NOT NULL DEFAULT now(),
update_dttm    TIMESTAMPTZ NOT NULL DEFAULT now(),
created_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- optional
updated_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL   -- optional
```

`update_dttm` is maintained by a trigger, never by clients:

```sql
CREATE OR REPLACE FUNCTION pollyflip_private.touch_update_dttm()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.update_dttm := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_touch_decks BEFORE UPDATE ON pollyflip.decks
  FOR EACH ROW EXECUTE FUNCTION pollyflip_private.touch_update_dttm();
```

For soft-delete: `archived_at TIMESTAMPTZ` (nullable, null = live). Do not use `deleted_at` alongside hard-delete — pick one discipline per table.

### 3.4 Foreign keys

- Column name is the referenced entity + `_id`: `deck_id REFERENCES pollyflip.decks(id)`.
- Default `ON DELETE RESTRICT`. Use `CASCADE` only for owned children whose existence is meaningless without the parent (e.g. `cards` cascade on `decks`).
- Never create a business-logic FK to `auth.users`. Mirror the user via `profiles` and FK to `profiles.id`.

### 3.5 Unknown concept → escalate

When a new domain concept arrives without a matching suffix (e.g. "temperature", "compass bearing"), stop and ask the human owner. The resolution is either (a) we pick an existing suffix with a documented semantic extension, or (b) we add a suffix to this table in a template PR. **Do not invent locally.**

---

## 4. Migration conventions

### 4.1 Filename format

`YYYYMMDDHHMMSS_description.sql`. Example: `20260420140000_pollyflip_schemas_and_enums.sql`. The timestamp is creation order, not chronological — always strictly increasing.

### 4.2 Grouping

One migration file per *logical unit*, not per table. A unit is: "the schemas + enums", "all the tables of domain X", "RLS + indexes for domain X", "the private-schema helper functions".

Keep a table's CREATE TABLE, its indexes, and its RLS policies in the same migration. Don't split "table created today, indexes tomorrow".

### 4.3 Idempotency (mandatory)

Every migration can be re-run without error. Concrete patterns:

```sql
-- Enums: wrap in DO $$ to handle "already exists"
DO $$ BEGIN
  CREATE TYPE pollyflip.deck_color AS ENUM ('clay', 'olive', 'ink');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tables: CREATE IF NOT EXISTS
CREATE TABLE IF NOT EXISTS pollyflip.decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ...
);

-- Columns: ADD COLUMN IF NOT EXISTS (Postgres 9.6+)
ALTER TABLE pollyflip.decks ADD COLUMN IF NOT EXISTS subtitle_txt TEXT;

-- Policies: DROP + CREATE (safer than CREATE OR REPLACE for policies)
DROP POLICY IF EXISTS "Decks: public read" ON pollyflip.decks;
CREATE POLICY "Decks: public read" ON pollyflip.decks FOR SELECT ...;

-- Functions: CREATE OR REPLACE
CREATE OR REPLACE FUNCTION pollyflip.is_deck_owner(p_deck_id UUID) ...

-- Triggers: DROP + CREATE
DROP TRIGGER IF EXISTS trg_touch_decks ON pollyflip.decks;
CREATE TRIGGER trg_touch_decks ...;
```

**Validation:** before committing a migration, run it twice against a local or throwaway Supabase instance. If the second run errors, it's not idempotent — fix it.

### 4.4 Schemas first, enums second, tables third

Ordering within the first migration of a new app:

1. `CREATE SCHEMA IF NOT EXISTS pollyflip;`
2. `CREATE SCHEMA IF NOT EXISTS pollyflip_private;` (if split)
3. Grants: `GRANT USAGE ON SCHEMA pollyflip TO anon, authenticated;` etc.
4. Enums inside the public schema.
5. Tables (CREATE TABLE IF NOT EXISTS).

Second migration: indexes + RLS policies + public helper functions.
Third migration: private-schema helper functions + triggers.

---

## 5. Auth model

### 5.1 Profiles mirror

Supabase Auth owns `auth.users`. Business logic sees `profiles` (or `<app>_users` — pick one name and stick with it). The profile mirrors the auth user 1:1.

```sql
CREATE TABLE IF NOT EXISTS pollyflip.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(120) NOT NULL,
  avatar_url VARCHAR(500),
  email VARCHAR(255),
  create_dttm TIMESTAMPTZ NOT NULL DEFAULT now(),
  update_dttm TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 5.2 Auto-insert trigger

On `auth.users` INSERT, a SECURITY DEFINER function creates the profile. This lives in the private schema when the split pattern is used.

```sql
CREATE OR REPLACE FUNCTION pollyflip_private.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO pollyflip.profiles (id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Anon'),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_pollyflip ON auth.users;
CREATE TRIGGER on_auth_user_created_pollyflip
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION pollyflip_private.handle_new_user();
```

**Rule:** the trigger name includes the app suffix (`on_auth_user_created_pollyflip`) because multiple apps can share the Supabase project and each needs its own trigger — Postgres does not allow two triggers with identical names on the same table.

### 5.3 No FK JOINs to `auth.users`

Business code queries `profiles`, never `auth.users` in a JOIN. RLS policies can still reference `auth.uid()` directly — that's Supabase's intended API.

---

## 6. RLS

### 6.1 Baseline

Every table that touches user data has RLS enabled:

```sql
ALTER TABLE pollyflip.decks ENABLE ROW LEVEL SECURITY;
```

RLS is **necessary but not sufficient**: service functions also perform explicit ownership checks before mutations. This is a template-wide rule (SPEC §6 #5, `app-stack-claude.md` #5).

### 6.2 Three canonical patterns

```sql
-- Pattern 1: public read, owner-only write
CREATE POLICY "Decks: public read" ON pollyflip.decks
  FOR SELECT USING (
    privacy_cd = 'public'
    OR owner_id = auth.uid()
    OR pollyflip.is_deck_collaborator(id, auth.uid())
  );

CREATE POLICY "Decks: owner insert" ON pollyflip.decks
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Decks: owner update" ON pollyflip.decks
  FOR UPDATE TO authenticated USING (owner_id = auth.uid());

CREATE POLICY "Decks: owner delete" ON pollyflip.decks
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- Pattern 2: owner-only view
CREATE POLICY "Card progress: self only" ON pollyflip.card_progress
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Pattern 3: nested EXISTS (child table scoped by parent ownership)
CREATE POLICY "Cards: deck owner" ON pollyflip.cards
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM pollyflip.decks d
    WHERE d.id = cards.deck_id AND d.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM pollyflip.decks d
    WHERE d.id = cards.deck_id AND d.owner_id = auth.uid()
  ));
```

### 6.3 Helper functions (avoid RLS recursion)

If a policy on table X needs to check a condition that reads table X, it recurses. The fix is a SECURITY DEFINER helper in the public or private schema:

```sql
CREATE OR REPLACE FUNCTION pollyflip.is_deck_collaborator(
  p_deck_id UUID, p_user_id UUID
) RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM pollyflip.deck_collaborators
    WHERE deck_id = p_deck_id AND user_id = p_user_id AND accepted_at IS NOT NULL
  );
$$;
```

SECURITY DEFINER bypasses RLS for the function body. Because the function body is a *narrow* check ("is this user a collaborator on this deck"), it's safe.

### 6.4 RLS gotchas

Three failure modes surfaced in production (miAcademia):

1. **Infinite recursion.** A policy on `user_roles` that queries `user_roles` to decide — Postgres errors with `infinite recursion detected`. Fix: extract the check into a SECURITY DEFINER function. See §6.3.

2. **TOCTOU on counters.** An invitation with `max_uses = 3` can be redeemed 5 times concurrently if the check is three steps: `SELECT uses → compare to max → INSERT redemption`. Fix: collapse into one SECURITY DEFINER RPC that locks the invitation row with `SELECT ... FOR UPDATE` before mutating.

3. **Permissive OR = escalation.** A `FOR ALL` policy with `USING (owner_id = auth.uid() OR is_collaborator())` lets a collaborator delete the owner's deck because `FOR ALL` covers DELETE too. Fix: split into explicit `FOR SELECT`, `FOR UPDATE`, `FOR DELETE` policies. Grant `DELETE` only to `owner_id = auth.uid()`.

---

## 7. Private-schema functions (when split pattern is used)

The private schema exists for functions that must run as the function owner (bypassing RLS) and should not be exposed via PostgREST.

**Typical use case:** business math that has to query and write across multiple tenant-scoped tables without the caller needing direct access.

```sql
CREATE OR REPLACE FUNCTION pollyflip_private.calculate_mastery(
  p_deck_id UUID
) RETURNS NUMERIC LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_total INT;
  v_mastered INT;
BEGIN
  SELECT COUNT(*) INTO v_total FROM pollyflip.cards WHERE deck_id = p_deck_id;
  SELECT COUNT(*) INTO v_mastered
  FROM pollyflip.card_progress cp
  JOIN pollyflip.cards c ON c.id = cp.card_id
  WHERE c.deck_id = p_deck_id AND cp.interval_days >= 30;
  RETURN CASE WHEN v_total = 0 THEN 0 ELSE v_mastered::numeric / v_total END;
END;
$$;
```

Clients call the wrapper in the public schema:

```sql
CREATE OR REPLACE FUNCTION pollyflip.deck_mastery(p_deck_id UUID)
RETURNS NUMERIC LANGUAGE sql STABLE AS $$
  SELECT pollyflip_private.calculate_mastery(p_deck_id);
$$;
REVOKE ALL ON FUNCTION pollyflip.deck_mastery(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION pollyflip.deck_mastery(UUID) TO authenticated;
```

Public schema holds the surface (the RPC signature); private schema holds the body. Swap bodies without touching clients.

---

## 8. Type generation

### 8.1 Command

```bash
npx supabase gen types typescript \
  --project-id <project-ref> \
  --schema <schema-name> \
  > packages/shared-types/src/<schema-name>.ts
```

`<schema-name>` matches the app schema (e.g. `pollyflip`). Generate once per schema — multiple schemas mean multiple output files, combined in `packages/shared-types/src/index.ts`.

### 8.2 Script convention

Add to `package.json` root scripts:

```json
"scripts": {
  "gen:types": "supabase gen types typescript --project-id $SUPABASE_PROJECT_REF --schema pollyflip > packages/shared-types/src/pollyflip.ts"
}
```

Projects with multiple schemas add multiple npm scripts (`gen:types:pollyflip`, `gen:types:auth`) and an umbrella `gen:types` that runs them in sequence.

### 8.3 Rules

- **Never hand-edit** generated files. If the compiler complains, fix the schema or the query, not the type.
- **Commit generated files** to git. Regenerate after every schema migration.
- **Import only `Database`, `Tables`, `Enums`** from the generated file. Don't grab internal helper types.

---

## 9. Service layer

Canonical signature, enforced template-wide:

```typescript
// packages/shared-supabase/src/services/decks.ts
import type { AppSupabaseClient } from '../client';
import type { Tables } from '@app-stack/shared-types/pollyflip';

export async function listMyDecks(
  client: AppSupabaseClient,
  args: { limit?: number }
): Promise<{ data: Tables<'decks'>[]; error: null } | { data: null; error: string }> {
  const { data, error } = await client
    .from('decks')
    .select('*')
    .order('update_dttm', { ascending: false })
    .limit(args.limit ?? 200);

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}
```

**Rules:**

- Function, not class. Named export.
- First arg is always `client`. Second is `args` (object, never positional). Return is a discriminated union, not a thrown error.
- No React hooks, no Next.js imports, no React Native imports inside `shared-supabase`.
- `.limit(args.limit ?? 200)` on every list query. **Every list query.**
- Every mutation validates ownership explicitly before the SQL call. RLS is the backstop, not the gate.

---

## 10. Caching (app layer)

Not schema-level, but adjacent. Two patterns tested in production (miAcademia):

### 10.1 Stale-while-revalidate (display data)

TanStack Query default is fine. Read: show stale data immediately, refetch in background, swap when fresh. Appropriate for: home feeds, deck lists, profile pages.

### 10.2 TTL with race prevention (transactional data)

For lists where a stale read leads to a user mistake (e.g. an inventory count), gate reads on an `isFetching` flag so concurrent reads coalesce:

```typescript
const deckStore = create<DeckState>((set, get) => ({
  isFetching: false,
  lastFetchedAt: 0,
  cachedOwnerId: null,
  async fetchDecks(ownerId: string) {
    const s = get();
    if (s.isFetching) return;
    if (s.cachedOwnerId === ownerId && Date.now() - s.lastFetchedAt < 60_000) return;
    set({ isFetching: true });
    try {
      // ...
    } finally {
      set({ isFetching: false, lastFetchedAt: Date.now(), cachedOwnerId: ownerId });
    }
  },
}));
```

---

## 11. Testing

- **No integration tests hitting Supabase in CI.** Too slow, too flaky, credential management is a liability.
- **Unit tests mock the Supabase client** at the service-function boundary. Pass a fake client that returns a canned `{ data, error }` shape.
- **Migrations are not tested automatically.** Validation is manual: run twice locally, confirm idempotency, then apply to sandbox before prod.
- **RLS policies benefit from a local Supabase + a golden-path integration test** when the app grows. Skip until the app's auth surface actually exists.

---

## 12. Legacy and deprecated

**Ruflo / `.swarm/memory.db`:** deprecated in AI Factory v2. If you inherit a project with these directories, ignore them for Supabase decisions — they contain opaque HNSW embeddings, not readable guidance. Do not remove them without confirming the repo has migrated to native Claude Code Memory.

**BookingRapaNui column suffixes (`_tx`, `_no`):** legacy. Do not replicate in new projects. The tool `init-app-stack.sh` does not rewrite existing columns in existing projects — migration would be manual and deliberate.

**`public` default schema for new apps:** the default Supabase layout (everything in `public`) still works but mixes concerns when multiple apps share a project. Prefer a named schema per app (§2.1 or §2.2) from day 1.

---

## 13. When this doc is wrong

If a project encounters a real need not covered here (new column suffix, new RLS pattern, new audit column), **do not improvise**. Open a PR against `app-stack-template/SUPABASE.md` with the case and proposed resolution. Every project then benefits.
