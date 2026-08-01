/**
 * Firecrawl client for enrichment crawls (competitor sites, blog posts,
 * community pages). Not a YouTube scraper — it complements Apify with
 * off-platform context. Implemented alongside Loop 003.
 */
export interface CrawlResult {
  url: string;
  markdown: string;
  fetchedAt: string; // ISO date
}

function apiKey(): string {
  const k = process.env.FIRECRAWL_API_KEY;
  if (!k) throw new Error("FIRECRAWL_API_KEY is not set (see .env.example)");
  return k;
}

export async function crawlUrl(url: string): Promise<CrawlResult> {
  void apiKey();
  void url;
  throw new Error("Not implemented yet — enrichment lands with Loop 003");
}
