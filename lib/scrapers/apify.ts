import type { ChannelInfo, Scraper, VideoInfo } from "./types";

const APIFY_BASE = "https://api.apify.com/v2";

function token(): string {
  const t = process.env.APIFY_TOKEN;
  if (!t) throw new Error("APIFY_TOKEN is not set (see .env.example)");
  return t;
}

/**
 * YouTube channel/video scraper backed by an Apify actor.
 * Implemented in Loop 002 (docs/loops/002-apify-channel-scrape.md).
 * Raw responses must be persisted to `raw_scrapes` before transformation,
 * and the 24h per-channel cache must be checked before calling out.
 */
export const apifyScraper: Scraper = {
  source: "apify",

  async fetchChannel(channelUrl: string): Promise<ChannelInfo> {
    void token();
    void APIFY_BASE;
    void channelUrl;
    throw new Error("Not implemented yet — see docs/loops/002-apify-channel-scrape.md");
  },

  async fetchVideos(channelUrl: string, limit = 30): Promise<VideoInfo[]> {
    void token();
    void channelUrl;
    void limit;
    throw new Error("Not implemented yet — see docs/loops/002-apify-channel-scrape.md");
  },
};
