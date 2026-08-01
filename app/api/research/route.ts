import { NextResponse } from "next/server";
import { apifyScraper } from "@/lib/scrapers";
import { findOutliers } from "@/lib/analysis/outliers";
import { heuristicSuggestions } from "@/lib/analysis/heuristics";

export const maxDuration = 300;

/**
 * POST /api/research — { channelUrl, maxVideos? }
 * Runs the real Apify scrape, deterministic outlier detection, and
 * pattern-based suggestions. Errors are returned honestly, never masked
 * as empty results.
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
    const videos = await apifyScraper.fetchVideos(channelUrl, maxVideos);
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
    const ideas = heuristicSuggestions(basis, 10);
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
      ideas,
      generator: "heuristic (deterministic — LLM generation ships in Loop 003)",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown scrape error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
