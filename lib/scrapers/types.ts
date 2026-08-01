export interface ChannelInfo {
  channelId: string;
  handle: string;
  title: string;
  subscriberCount: number | null;
  url: string;
}

export interface VideoInfo {
  videoId: string;
  title: string;
  viewCount: number;
  publishedAt: string; // ISO date
  thumbnailUrl: string | null;
  durationSeconds: number | null;
}

/**
 * Every data source implements this contract. Add optional fields to the
 * shapes above when a source returns more — never break existing fields.
 * See skill: .claude/skills/add-scraper/SKILL.md
 */
export interface Scraper {
  readonly source: "apify" | "firecrawl";
  fetchChannel(channelUrl: string): Promise<ChannelInfo>;
  fetchVideos(channelUrl: string, limit?: number): Promise<VideoInfo[]>;
}
