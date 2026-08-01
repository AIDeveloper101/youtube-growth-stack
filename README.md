# YouTube Growth Stack

**Talk to your agent. It analyzes competitor channels, finds outlier videos, and
generates titles, video ideas, and thumbnail concepts — then talks back.**

Open source (MIT). Voice-native. Agent-first: the codebase is structured so
coding agents (Claude Code via `CLAUDE.md`, Codex via `AGENTS.md`) can pick up
work on their own and ship it through pull requests.

| | |
|---|---|
| Frontend | Next.js (App Router) · React · ShadCN + TweakCN theme |
| Voice | OpenWhispr (speech-to-text / text-to-speech) |
| Data | Apify (YouTube scraping) · Firecrawl (web enrichment) |
| Database | Supabase (Postgres · Auth · Storage) |
| Payments | Stripe subscriptions |
| Workflow | Loop engineering · skills · PR-gated agent work |

---

## 1 · Product architecture

```mermaid
flowchart TB
    subgraph CLIENT["Client — chat + voice native"]
        UI["Conversation dashboard<br/>Next.js · ShadCN · TweakCN"]
        VC["OpenWhispr<br/>speech-to-text · text-to-speech"]
    end
    subgraph BACKEND["Backend — API routes"]
        VA["Voice agent<br/>intent → tools → spoken reply"]
        BW["Background workers<br/>research jobs"]
        AN["Analysis engine<br/>outliers → titles · ideas · thumbnails"]
        PAY["Stripe<br/>subscriptions"]
    end
    subgraph DATA["Data collection"]
        AP["Apify<br/>YouTube scraper"]
        FC["Firecrawl<br/>web crawling"]
    end
    SB["Supabase<br/>Postgres · Auth · Storage"]
    VC <--> UI
    UI <--> VA
    VA --> BW
    VA --> PAY
    BW --> AN
    AN --> AP
    AN --> FC
    AP --> SB
    FC --> SB
    AN --> SB
    SB --> VA
```

## 2 · User experience

The dashboard is a conversation, not a form. One journey, four moments:

```mermaid
journey
    title From question to published video
    section Ask
      Speak or type the request: 5: You
      Instant acknowledgment: 4: Agent
    section Wait (minutes, not hours)
      Research runs in background: 3: Agent
      Progress spoken on request: 4: Agent
    section Receive
      Outliers + ideas spoken back: 5: Agent
      Browse evidence on screen: 5: You
    section Act
      Pick a title and thumbnail: 5: You
      Publish and grow: 5: You
```

## 3 · Example conversation

```mermaid
sequenceDiagram
    actor U as You
    participant VA as Voice Agent
    participant BW as Background Worker
    participant EXT as YouTube · Apify · Firecrawl
    participant SB as Supabase
    U->>VA: "Find competitor outliers and give me ten ideas"
    VA->>VA: Understand intent + required tools
    VA->>BW: Start competitor research
    VA-->>U: "I've started the analysis. This may take two minutes."
    BW->>EXT: Collect and enrich data
    EXT-->>BW: Return videos and research
    BW->>SB: Save normalized evidence and insights
    BW-->>VA: Research completed
    VA-->>U: "I found six outliers and three strong content gaps"
```

## 4 · Data flow

```mermaid
flowchart LR
    IN["Channel URL"] --> CACHE{"Fresh scrape<br/>&lt; 24h?"}
    CACHE -->|yes| RAW[("raw_scrapes<br/>Supabase")]
    CACHE -->|no| SCRAPE["Apify actor run"]
    SCRAPE --> RAW
    RAW --> OUT["Outlier detection<br/>deterministic code"]
    OUT --> GEN["Creative generation<br/>LLM — outliers only"]
    GEN --> IDEAS[("ideas<br/>Supabase")]
    IDEAS --> VOICE["Spoken + on-screen reply"]
```

Two cost rules are built into this flow: raw data is stored **before** analysis
(re-analyze for free, never re-scrape needlessly), and the LLM only ever sees
pre-filtered outliers (deterministic code does the cheap work first).

## 5 · Repository structure

```mermaid
flowchart TB
    ROOT["youtube-growth-stack/"]
    ROOT --> AGENTIC["Agent infrastructure"]
    ROOT --> PRODUCT["Product code"]
    AGENTIC --> CM["CLAUDE.md — primary rulebook (Claude)"]
    AGENTIC --> AM["AGENTS.md — mirror (Codex / generic)"]
    AGENTIC --> SK[".claude/skills/ — add-ui-page · add-scraper · db-migration"]
    AGENTIC --> LO["docs/loops/ — work queue, one loop per file"]
    AGENTIC --> DE["docs/decisions/ — append-only ADRs"]
    PRODUCT --> APP["app/ — pages + API routes"]
    PRODUCT --> CO["components/ — ShadCN + TweakCN"]
    PRODUCT --> LIB["lib/ — voice · agent · scrapers · analysis · supabase · stripe"]
    PRODUCT --> MI["supabase/migrations/ — numbered SQL"]
```

## 6 · Agent workflow

```mermaid
flowchart TB
    A["Loop defined in docs/loops/"] --> B["Agent reads CLAUDE.md / AGENTS.md"]
    B --> C["Picks the matching skill<br/>.claude/skills/*/SKILL.md"]
    C --> D["New feature branch"]
    D --> E["Builds + runs the loop's proof"]
    E --> F["Opens pull request<br/>(.github/PULL_REQUEST_TEMPLATE.md)"]
    F --> G{"Human review"}
    G -->|changes requested| E
    G -->|approved| H["Merged to main"]
    H --> A
```

The agent never pushes to `main`. Every merge passes a human.

## 7 · Implementation loop (how every unit of work ships)

```mermaid
flowchart LR
    P["PLAN<br/>pick ONE loop file"] --> B["BUILD<br/>only what it describes"]
    B --> V["VERIFY<br/>run the loop's proof"]
    V -->|fails| B
    V -->|passes| S["SHIP<br/>branch → PR → review → merge"]
    S --> P
```

Phases ship in order, each closing with running proof:

| Phase | Ships | Proof |
|---|---|---|
| 0 · Foundation | Repo, scaffold, rulebooks, skills | Build passes; agent opens a demo PR |
| 1 · Data | Supabase schema, Apify, Firecrawl | Real channel data lands in the database |
| 2 · Analysis | Outliers + idea engine | 10 stored suggestions with evidence |
| 3 · Interface | Chat + voice dashboard | Say it → agent speaks ideas back |
| 4 · Launch | Stripe, quotas, docs | Test payment clears; repo public |

---

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your own keys — never commit this file
npm run dev
```

The work queue lives in [`docs/loops/`](docs/loops/) — start with Loop 001.
Agents: read [`CLAUDE.md`](CLAUDE.md) (Claude) or [`AGENTS.md`](AGENTS.md)
(Codex/generic) before touching anything.

## License

[MIT](LICENSE) — build on it, sell it, fork it. Attribution appreciated.
