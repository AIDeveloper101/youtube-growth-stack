import { NextResponse } from "next/server";
import { apifyScraper } from "@/lib/scrapers";
import { tryEnrichChannel } from "@/lib/scrapers/firecrawl";
import { findOutliers } from "@/lib/analysis/outliers";
import { generateSuggestions } from "@/lib/analysis/generate";

export const maxDuration = 300;

/**
 * POST /api/research — { channelUrl, maxVideos? }
 * Real pipeline: Apify scrape → deterministic outlier detection →
 * Firecrawl enrichment (best-effort) → LLM suggestions
 * (Anthropic → OpenAI → heuristic chain, provenance always labeled).
 * Errors are returned honestly, never masked as empty results.
 */
export async function POST(req: Request) {
  let body: { channelUrl?: string; maxVideos?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const channelUrl = body.channelUrl?.trim();
  if (!channelUrl || !/^https?:\/\/(www\.)?youtube\.com\//i.test(channelUrl)) {
    return NextResponse.json(
      { error: "channelUrl must be a youtube.com URL" },
      { status: 400 },
    );
  }

  const maxVideos = Math.min(Math.max(body.maxVideos ?? 15, 5), 30);

  try {
    // Scrape (Apify) and enrich (Firecrawl) concurrently — enrichment is
    // best-effort and never fails the run.
    const [videos, enrichment] = await Promise.all([
      apifyScraper.fetchVideos(channelUrl, maxVideos),
      tryEnrichChannel(channelUrl),
    ]);
    if (videos.length === 0) {
      return NextResponse.json(
        { error: "Apify returned no videos for this channel" },
        { status: 502 },
      );
    }
    const outliers = findOutliers(videos, 2.0);
    const basis =
      outliers.length > 0
        ? outliers
        : // honest fallback: no true outliers → use top videos, flagged as such
          [...videos]
            .sort((a, b) => b.viewCount - a.viewCount)
            .slice(0, 3)
            .map((video) => ({ video, ratio: 1 }));
    const { suggestions, generator } = await generateSuggestions(basis, 10, enrichment);
    return NextResponse.json({
      channelUrl,
      videosAnalyzed: videos.length,
      outliers: outliers.map((o) => ({
        videoId: o.video.videoId,
        title: o.video.title,
        viewCount: o.video.viewCount,
        thumbnailUrl: o.video.thumbnailUrl,
        ratio: Number(o.ratio.toFixed(2)),
      })),
      trueOutliers: outliers.length > 0,
      enriched: enrichment !== null,
      ideas: suggestions,
      generator,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown research error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
