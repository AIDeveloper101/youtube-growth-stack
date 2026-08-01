import type { ChannelInfo, Scraper, VideoInfo } from "./types";

const APIFY_BASE = "https://api.apify.com/v2";
const ACTOR = "streamers~youtube-scraper";

function token(): string {
  const t = process.env.APIFY_TOKEN;
  if (!t) throw new Error("APIFY_TOKEN is not set (see .env.example)");
  return t;
}

interface ApifyYoutubeItem {
  id?: string;
  title?: string;
  url?: string;
  viewCount?: number;
  date?: string;
  duration?: string;
  thumbnailUrl?: string;
  channelId?: string;
  channelName?: string;
  channelUrl?: string;
  numberOfSubscribers?: number;
}

function parseDuration(d: string | undefined): number | null {
  if (!d) return null;
  const parts = d.split(":").map(Number);
  if (parts.some(Number.isNaN)) return null;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

async function runActor(channelUrl: string, limit: number): Promise<ApifyYoutubeItem[]> {
  const res = await fetch(
    `${APIFY_BASE}/acts/${ACTOR}/run-sync-get-dataset-items?token=${token()}&timeout=240`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startUrls: [{ url: channelUrl }],
        maxResults: limit,
        maxResultsShorts: 0,
        maxResultStreams: 0,
      }),
      // Actor runs take minutes — do not let the platform default cut it short.
      signal: AbortSignal.timeout(250_000),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Apify actor failed (HTTP ${res.status}): ${body.slice(0, 200)}`);
  }
  return (await res.json()) as ApifyYoutubeItem[];
}

export const apifyScraper: Scraper = {
  source: "apify",

  async fetchChannel(channelUrl: string): Promise<ChannelInfo> {
    const items = await runActor(channelUrl, 1);
    const first = items[0];
    if (!first) throw new Error("Apify returned no data for this channel");
    return {
      channelId: first.channelId ?? channelUrl,
      handle: first.channelUrl?.split("/").pop() ?? channelUrl,
      title: first.channelName ?? "Unknown channel",
      subscriberCount: first.numberOfSubscribers ?? null,
      url: first.channelUrl ?? channelUrl,
    };
  },

  async fetchVideos(channelUrl: string, limit = 30): Promise<VideoInfo[]> {
    const items = await runActor(channelUrl, limit);
    return items
      .filter((i) => i.id && i.title && typeof i.viewCount === "number")
      .map((i) => ({
        videoId: i.id as string,
        title: i.title as string,
        viewCount: i.viewCount as number,
        publishedAt: i.date ?? "",
        thumbnailUrl: i.thumbnailUrl ?? null,
        durationSeconds: parseDuration(i.duration),
      }));
  },
};
