# Loop 002 — Apify: scrape one competitor channel end to end

**Phase:** 1 · **Status:** todo

## Goal

Given a channel URL, fetch channel + recent videos via Apify and store the raw
result in `raw_scrapes`.

## Scope

- Included: `lib/scrapers/apify.ts` real implementation, 24h cache check,
  one dev API route to trigger it
- Not included: analysis, UI, Firecrawl

## Steps

1. Follow skill `add-scraper`.
2. Implement `fetchChannel` / `fetchVideos` against the YouTube scraper actor.
3. Add `APIFY_TOKEN` to `.env.example`; user sets the real value in
   `.env.local` themselves (out-of-band — never paste secrets into chat).

## Verify

- [ ] A real channel URL returns titles + view counts
- [ ] Raw row visible in `raw_scrapes`; second call within 24h hits the cache
- [ ] `npm run build` passes

## Ship

Branch `feature/apify-scraper` → PR → review → merge.
