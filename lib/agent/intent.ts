export type Intent =
  | { kind: "analyze-channel"; channelUrl: string }
  | { kind: "list-ideas" }
  | { kind: "help" }
  | { kind: "unknown"; utterance: string };

/**
 * Deterministic first pass: cheap pattern routing before any LLM call.
 * The LLM fallback for ambiguous utterances lands with Loop 004.
 */
export function routeIntent(utterance: string): Intent {
  const text = utterance.trim();
  const urlMatch = text.match(
    /https?:\/\/(www\.)?youtube\.com\/(@[\w.-]+|channel\/[\w-]+)/i,
  );
  if (urlMatch) return { kind: "analyze-channel", channelUrl: urlMatch[0] };
  if (/\b(ideas?|suggestions?|results?)\b/i.test(text) && /\b(show|list|my)\b/i.test(text))
    return { kind: "list-ideas" };
  if (/\b(help|what can you do)\b/i.test(text)) return { kind: "help" };
  return { kind: "unknown", utterance: text };
}
