import type { Outlier } from "./outliers";

export interface Suggestion {
  kind: "title" | "idea" | "thumbnail-concept";
  text: string;
  /** which outlier video inspired this suggestion (evidence link) */
  evidenceVideoId: string;
}

/**
 * Creative generation — the one place the LLM earns its cost (ADR 0001).
 * Receives ONLY pre-filtered outliers from findOutliers(); implemented in
 * Loop 003 (docs/loops/003-analysis-engine.md).
 */
export async function generateSuggestions(
  outliers: Outlier[],
  count = 10,
): Promise<Suggestion[]> {
  void outliers;
  void count;
  throw new Error("Not implemented yet — see docs/loops/003-analysis-engine.md");
}
