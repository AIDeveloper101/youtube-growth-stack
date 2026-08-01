import type { Outlier } from "./outliers";
import type { Suggestion } from "./generate";

/**
 * Deterministic idea generation from outlier evidence — no LLM, no cost,
 * fully reproducible (ADR 0001 deterministic-gate rule). When an LLM key is
 * configured, lib/analysis/generate.ts will replace this with creative
 * generation; until then these are honestly labeled as pattern-based.
 */
export function heuristicSuggestions(outliers: Outlier[], count = 10): Suggestion[] {
  const out: Suggestion[] = [];
  for (const { video, ratio } of outliers) {
    const x = ratio.toFixed(1);
    out.push(
      {
        kind: "title",
        text: `Remake for your niche: "${video.title}" (${x}× this channel's median views)`,
        evidenceVideoId: video.videoId,
      },
      {
        kind: "idea",
        text: `This format outperformed the channel ${x}×. Break down why "${video.title}" worked (hook, topic, timing) and adapt the angle to your audience.`,
        evidenceVideoId: video.videoId,
      },
      {
        kind: "thumbnail-concept",
        text: `Study the thumbnail of "${video.title}" — keep its composition (subject size, contrast, text density), swap in your own subject.`,
        evidenceVideoId: video.videoId,
      },
    );
    if (out.length >= count) break;
  }
  return out.slice(0, count);
}
