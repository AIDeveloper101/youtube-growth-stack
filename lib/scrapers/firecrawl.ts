/**
 * Firecrawl client for enrichment crawls (channel about pages, competitor
 * sites, blog posts). Complements Apify with off-platform context.
 * For production self-hosting (no API costs): github.com/firecrawl/firecrawl
 */
export interface CrawlResult {
  url: string;
  markdown: string;
}

function apiKey(): string {
  const k = process.env.FIRECRAWL_API_KEY;
  if (!k) throw new Error("FIRECRAWL_API_KEY is not set (see .env.example)");
  return k;
}

export async function crawlUrl(url: string): Promise<CrawlResult> {
  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    throw new Error(`Firecrawl failed (HTTP ${res.status}): ${(await res.text()).slice(0, 200)}`);
  }
  const data = (await res.json()) as { data?: { markdown?: string } };
  if (!data.data?.markdown) throw new Error("Firecrawl returned no markdown");
  return { url, markdown: data.data.markdown };
}

/** Best-effort enrichment — a failed crawl never fails the research run. */
export async function tryEnrichChannel(channelUrl: string): Promise<string | null> {
  try {
    const about = await crawlUrl(`${channelUrl.replace(/\/$/, "")}/about`);
    return about.markdown;
  } catch {
    return null;
  }
}
