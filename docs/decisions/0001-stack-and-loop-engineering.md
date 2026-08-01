# ADR 0001 — Stack choice and loop-engineering workflow

**Date:** 2026-08-01 · **Status:** accepted

## Decision

- Next.js App Router serves both UI and API (one deployable).
- Supabase for Postgres + Auth + Storage; raw scrape data is always persisted
  before analysis so analysis can re-run without re-scraping.
- Apify (YouTube) + Firecrawl (web) behind a single `Scraper` interface.
- Voice-native dashboard: OpenWhispr for STT/TTS; the agent acknowledges
  instantly and works asynchronously.
- All work ships via loop engineering: small loops in `docs/loops/`, each with
  machine-verifiable proof, each merged through a pull request.
- Deterministic-gate rule: anything checkable by code is checked by code
  (outlier math, caching, schema); the LLM is reserved for judgment
  (titles, ideas, thumbnail concepts).

## Consequences

- Scraper breakage is isolated to `lib/scrapers/`.
- Costs are controlled by the 24h cache + free-tier quotas.
- Agents (Claude via CLAUDE.md, Codex via AGENTS.md) can work autonomously
  inside PR guardrails.

> Append-only: if this decision changes, add a superseding ADR — do not edit.
