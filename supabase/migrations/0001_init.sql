-- Loop 001: core tables. Append-only — fix mistakes with a new migration.

create table if not exists channels (
  id uuid primary key default gen_random_uuid(),
  url text not null unique,
  handle text,
  title text,
  created_at timestamptz not null default now()
);

create table if not exists raw_scrapes (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references channels(id) on delete cascade,
  source text not null check (source in ('apify', 'firecrawl')),
  payload jsonb not null,
  scraped_at timestamptz not null default now()
);

create index if not exists raw_scrapes_channel_fresh
  on raw_scrapes (channel_id, scraped_at desc);

create table if not exists ideas (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references channels(id) on delete cascade,
  kind text not null check (kind in ('title', 'idea', 'thumbnail-concept')),
  text text not null,
  evidence_video_id text,
  created_at timestamptz not null default now()
);

-- RLS: every table locked down by default; policies widen access deliberately.
alter table channels enable row level security;
alter table raw_scrapes enable row level security;
alter table ideas enable row level security;

-- Until auth lands (Phase 3+), only the service role reads/writes.
-- Deliberately NO anon policies yet — absence of access is the honest default.
