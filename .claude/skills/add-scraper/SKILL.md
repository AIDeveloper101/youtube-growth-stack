---
name: add-scraper
description: Add a new data source (Apify actor, Firecrawl target, or other scraper) behind the existing scraper interface. Use when a loop asks for new competitor data, a new platform, or richer channel/video fields.
---

# Add a scraper / data source

## Steps

1. **Interface first** — every scraper implements the `Scraper` contract in
   `lib/scrapers/types.ts` (`fetchChannel`, `fetchVideos`). Extend the shared
   types there if the new source returns new fields — optional fields only,
   never breaking existing ones.
2. **Client** — create `lib/scrapers/<source>.ts`. Read API tokens from
   `process.env` (server-side only); add the new key to `.env.example` with a
   placeholder, never a real value.
3. **Raw data is sacred** — store the raw scrape result in Supabase
   (`raw_scrapes` table) before any transformation, so analysis can re-run
   without re-scraping (scrapes cost money; re-analysis is free).
4. **Cache** — respect the 24h per-channel cache: check `raw_scrapes` for a
   fresh row before calling the external API.
5. **Register** — export the new scraper from `lib/scrapers/index.ts`.

## Verify

- `npm run build` passes.
- A test invocation (dev route or script) returns real data for one known
  channel, and the raw row appears in `raw_scrapes`.
- `.env.example` contains the new key; `git diff` shows no secret values.

## Boundaries

- Never call scrapers from client components — server routes/workers only.
- Never commit fixture data containing real API responses with tokens in them.
