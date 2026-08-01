import type { Outlier } from "../analysis/outliers";
import type { Suggestion } from "../analysis/generate";

const MODEL = "gpt-4o-mini";

/**
 * Optional fallback generator — used only when ANTHROPIC_API_KEY is absent
 * but OPENAI_API_KEY is set. Kept dependency-free (plain fetch).
 */
export async function generateWithOpenAI(
  outliers: Outlier[],
  count: number,
  enrichment: string | null,
): Promise<Suggestion[]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");

  const evidence = outliers
    .map((o) => `- videoId=${o.video.videoId} · "${o.video.title}" · ${o.video.viewCount} views · ${o.ratio.toFixed(1)}x median`)
    .join("\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: `You are a YouTube growth strategist. Outlier videos:\n${evidence}\n${enrichment ? `Context:\n${enrichment.slice(0, 2000)}\n` : ""}Return JSON {"suggestions":[{"kind":"title"|"idea"|"thumbnail-concept","text":string,"evidenceVideoId":string}]} with exactly ${count} specific, non-generic suggestions citing the inspiring videoId.`,
        },
      ],
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`OpenAI failed (HTTP ${res.status}): ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  const parsed = JSON.parse(data.choices[0].message.content) as { suggestions: Suggestion[] };
  return parsed.suggestions.slice(0, count);
}

export const openaiModelLabel = `openai:${MODEL}`;
