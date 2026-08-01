import type { VideoInfo } from "../scrapers/types";

export interface Outlier {
  video: VideoInfo;
  /** viewCount divided by the channel's median views — 3.0 means 3× median */
  ratio: number;
}

/**
 * Deterministic outlier detection — plain code, no LLM.
 * A video is an outlier when its views exceed `threshold` × channel median.
 * Deterministic-gate rule (ADR 0001): anything checkable by code is code.
 */
export function findOutliers(videos: VideoInfo[], threshold = 2.5): Outlier[] {
  if (videos.length < 3) return [];
  const sorted = [...videos].map((v) => v.viewCount).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  if (median <= 0) return [];
  return videos
    .map((video) => ({ video, ratio: video.viewCount / median }))
    .filter((o) => o.ratio >= threshold)
    .sort((a, b) => b.ratio - a.ratio);
}
