/**
 * Background research worker. The voice agent acknowledges instantly
 * ("Started — this may take two minutes") and this worker does the slow part:
 * scrape → persist raw → analyze → persist ideas → notify completion.
 * Implemented across Loops 002–004.
 */
export interface ResearchJob {
  id: string;
  channelUrl: string;
  status: "queued" | "running" | "done" | "failed";
  startedAt: string; // ISO date
  error?: string;
}

export async function startResearch(channelUrl: string): Promise<ResearchJob> {
  void channelUrl;
  throw new Error("Not implemented yet — see docs/loops/002 and 003");
}

export async function getJob(id: string): Promise<ResearchJob | null> {
  void id;
  throw new Error("Not implemented yet — see docs/loops/004-voice-dashboard.md");
}
