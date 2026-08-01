<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# YouTube Growth Stack — Agent Rulebook (Codex / generic agents)

> Codex-compatible mirror of `CLAUDE.md` (the primary rulebook for Claude Code).
> When rules change, update both files.

## What this project is

An open-source, voice-native tool that analyzes competitor YouTube channels and
generates titles, video ideas, and thumbnail concepts. The dashboard is a
conversation: the user speaks (or types), a voice agent dispatches background
research, and the agent speaks the results back.

Stack: Next.js (App Router, TypeScript, Tailwind v4) · ShadCN + TweakCN theme ·
Supabase (Postgres, Auth, Storage) · Apify + Firecrawl (data collection) ·
OpenWhispr (speech-to-text / text-to-speech) · Stripe (subscriptions).

## How work happens here: loop engineering

Work ships in small verified loops, never as one giant task.

1. **Plan** — pick ONE loop from `docs/loops/`. If none fits, write a new loop
   file first (copy `docs/loops/000-template.md`).
2. **Build** — implement only what the loop describes.
3. **Verify** — run the loop's listed proof commands. A loop without passing
   proof is not done.
4. **Ship** — commit on a feature branch, open a pull request. Never commit to
   `main` directly.

## Commands

| Purpose | Command |
|---|---|
| Dev server | `npm run dev` |
| Production build (proof of compile) | `npm run build` |
| Lint | `npm run lint` |

## Skills (reusable recipes)

Recipes live in `.claude/skills/<name>/SKILL.md`. They are plain markdown —
readable by any agent, not only Claude. Before implementing a task that matches
a skill, read and follow it:

- `add-ui-page` — add a new page/screen to the app
- `add-scraper` — add a new data source (Apify actor, Firecrawl target)
- `db-migration` — change the Supabase schema safely

## Repository map

- `app/` — Next.js pages + API routes (`app/api/`)
- `components/` — ShadCN/TweakCN UI components
- `lib/voice/` — OpenWhispr bridge (STT/TTS)
- `lib/agent/` — voice-agent intent routing + background workers
- `lib/scrapers/` — Apify + Firecrawl clients
- `lib/analysis/` — title / idea / thumbnail generation logic
- `lib/supabase/`, `lib/stripe/` — infrastructure clients
- `supabase/migrations/` — SQL migrations, numbered, append-only
- `docs/loops/` — the work queue (one loop per file)
- `docs/decisions/` — decision records (append-only; supersede, never delete)

## Hard rules

- **Never** read, write, log, or commit `.env.local` or any secret value.
  New config keys go into `.env.example` with a placeholder.
- **Never** push to `main`; all changes go through a pull request.
- The TweakCN theme in `app/globals.css` is the single source of styling truth.
  Do not introduce ad-hoc colors or fonts; use the theme tokens.
- Migrations are append-only: fix a bad migration with a new one.
- Decision records in `docs/decisions/` are immutable: supersede, never edit.
- When a loop's verify step fails, fix and re-verify before opening the PR —
  do not open PRs with known-failing proof.

## Style

- TypeScript strict; no `any` unless annotated with a reason.
- Server components by default; `"use client"` only where interaction demands.
- Keep modules deep and small-surfaced: one clear entry point per `lib/` area.
