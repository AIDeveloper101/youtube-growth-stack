---
name: db-migration
description: Change the Supabase/Postgres schema safely with numbered, append-only SQL migrations. Use for any table, column, index, or RLS policy change.
---

# Database migration

## Steps

1. **Number** — next file is `supabase/migrations/NNNN_short_name.sql` where
   `NNNN` is the highest existing number + 1. Check the folder first; never
   reuse or edit an existing migration.
2. **Write SQL** — one concern per migration. Include `create table if not
   exists` / `alter table` guards where safe re-runs matter.
3. **RLS** — every new table gets row-level security enabled and an explicit
   policy. A table without a policy is a finding, not a shortcut.
4. **Types** — if the app reads the table, update the row types in
   `lib/supabase/types.ts` to match.

## Verify

- SQL applies cleanly to a fresh database (Supabase SQL editor or
  `supabase db reset` locally).
- `npm run build` passes after type updates.
- New tables show RLS enabled.

## Boundaries

- Append-only: a wrong migration is fixed by a NEW migration, never by editing
  history.
- No destructive statements (`drop table`, `truncate`) without an explicit
  human-approved loop that calls for them.
