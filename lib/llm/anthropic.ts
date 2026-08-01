import Anthropic from "@anthropic-ai/sdk";
import type { Outlier } from "../analysis/outliers";
import type { Suggestion } from "../analysis/generate";

const MODEL = "claude-opus-5";

const SUGGESTIONS_SCHEMA = {
  type: "object" as const,
  properties: {
    suggestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["title", "idea", "thumbnail-concept"] },
          text: { type: "string" },
          evidenceVideoId: { type: "string" },
        },
        required: ["kind", "text", "evidenceVideoId"],
        additionalProperties: false,
      },
    },
  },
  required: ["suggestions"],
  additionalProperties: false,
};

function buildPrompt(outliers: Outlier[], count: number, enrichment: string | null): string {
  const evidence = outliers
    .map(
      (o) =>
        `- videoId=${o.video.videoId} · "${o.video.title}" · ${o.video.viewCount.toLocaleString("en-US")} views · ${o.ratio.toFixed(1)}× channel median`,
    )
    .join("\n");
  return [
    `You are a YouTube growth strategist. These videos outperformed their channel's median views — they are proven evidence of what this audience responds to:`,
    evidence,
    enrichment ? `Additional channel context (scraped from the web):\n${enrichment.slice(0, 2000)}` : "",
    `Generate exactly ${count} suggestions a creator in this niche can act on: a mix of "title" (ready-to-use video titles), "idea" (video concepts with the angle explained), and "thumbnail-concept" (composition described concretely). Each suggestion must cite the evidenceVideoId of the outlier that inspired it. Be specific and non-generic — no filler like "make engaging content".`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

/**
 * Primary creative generator (ADR 0001: LLM only sees pre-filtered outliers).
 * Server-side refusal fallback is enabled so a safety decline degrades
 * gracefully instead of failing the request.
 */
export async function generateWithClaude(
  outliers: Outlier[],
  count: number,
  enrichment: string | null,
): Promise<Suggestion[]> {
  const client = new Anthropic();
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000, // thinking (on by default) + structured output share this cap
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { format: { type: "json_schema", schema: SUGGESTIONS_SCHEMA } },
    messages: [{ role: "user", content: buildPrompt(outliers, count, enrichment) }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("Claude declined the request (safety classifiers) — falling back");
  }
  const text = response.content.find((b) => b.type === "text")?.text;
  if (!text) throw new Error("Claude returned no text content");
  const parsed = JSON.parse(text) as { suggestions: Suggestion[] };
  return parsed.suggestions.slice(0, count);
}

export const anthropicModelLabel = `anthropic:${MODEL}`;
