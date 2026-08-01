/**
 * OpenWhispr bridge — speech-to-text in, text-to-speech out.
 * The dashboard talks to these two functions only; swapping the voice
 * backend later means changing this file and nothing else.
 * Implemented in Loop 004 (docs/loops/004-voice-dashboard.md).
 */

export interface Transcript {
  text: string;
  confidence: number | null;
}

export async function transcribe(audio: Blob): Promise<Transcript> {
  void audio;
  throw new Error("Not implemented yet — see docs/loops/004-voice-dashboard.md");
}

export async function speak(text: string): Promise<Blob> {
  void text;
  throw new Error("Not implemented yet — see docs/loops/004-voice-dashboard.md");
}
