import type { Outlier } from "./outliers";
import { heuristicSuggestions } from "./heuristics";
import { anthropicModelLabel, generateWithClaude } from "../llm/anthropic";
import { generateWithOpenAI, openaiModelLabel } from "../llm/openai";

export interface Suggestion {
  kind: "title" | "idea" | "thumbnail-concept";
  text: string;
  /** which outlier video inspired this suggestion (evidence link) */
  evidenceVideoId: string;
}

export interface GenerationResult {
  suggestions: Suggestion[];
  /** honest provenance label shown in the UI — never fake which engine ran */
  generator: string;
}

/**
 * Provider chain (ADR 0001 deterministic-gate: LLM only sees pre-filtered
 * outliers): Anthropic (primary) → OpenAI (optional) → deterministic
 * heuristics (always available). Each fallback is labeled honestly.
 */
export async function generateSuggestions(
  outliers: Outlier[],
  count = 10,
  enrichment: string | null = null,
): Promise<GenerationResult> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return {
        suggestions: await generateWithClaude(outliers, count, enrichment),
        generator: anthropicModelLabel,
      };
    } catch (err) {
      console.error("Anthropic generation failed:", err);
    }
  }
  if (process.env.OPENAI_API_KEY) {
    try {
      return {
        suggestions: await generateWithOpenAI(outliers, count, enrichment),
        generator: openaiModelLabel,
      };
    } catch (err) {
      console.error("OpenAI generation failed:", err);
    }
  }
  return {
    suggestions: heuristicSuggestions(outliers, count),
    generator: "heuristic (deterministic — set ANTHROPIC_API_KEY for LLM generation)",
  };
}
