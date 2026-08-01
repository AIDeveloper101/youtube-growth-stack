/** Row types mirroring supabase/migrations — update together (skill: db-migration). */

export interface ChannelRow {
  id: string;
  url: string;
  handle: string | null;
  title: string | null;
  created_at: string;
}

export interface RawScrapeRow {
  id: string;
  channel_id: string;
  source: "apify" | "firecrawl";
  payload: unknown; // raw API response, stored before any transformation
  scraped_at: string;
}

export interface IdeaRow {
  id: string;
  channel_id: string;
  kind: "title" | "idea" | "thumbnail-concept";
  text: string;
  evidence_video_id: string | null;
  created_at: string;
}
