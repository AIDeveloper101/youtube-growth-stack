# Loop 001 — Supabase schema: channels, raw_scrapes, ideas

**Phase:** 1 · **Status:** todo

## Goal

Create the core tables so scraped data and generated ideas have a home.

## Scope

- Included: `channels`, `raw_scrapes`, `ideas` tables + RLS policies,
  row types in `lib/supabase/types.ts`
- Not included: auth flows, Stripe tables, any UI

## Steps

1. Follow skill `db-migration`.
2. Write `supabase/migrations/0001_init.sql` (already drafted — review, apply).
3. Update `lib/supabase/types.ts` to match.

## Verify

- [ ] Migration applies cleanly to the Supabase project
- [ ] All three tables show RLS enabled
- [ ] `npm run build` passes

## Ship

Branch `feature/supabase-schema` → PR → review → merge.
