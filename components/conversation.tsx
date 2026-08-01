"use client";

import { useRef, useState } from "react";
import { routeIntent } from "@/lib/agent/intent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: "you" | "agent";
  text: string;
  tone?: "normal" | "pending" | "honest-gap";
}

const WELCOME: Message = {
  role: "agent",
  text: "Hi! Paste a competitor channel URL (youtube.com/@handle) and I'll research it, or ask \"what can you do\".",
};

/**
 * Conversation dashboard shell (Loop 004 scope).
 * Intent routing is live (deterministic, lib/agent/intent.ts). The research
 * worker and OpenWhispr voice bridge are honestly surfaced as not yet wired —
 * no fake results, ever.
 */
export function Conversation() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  function agentReply(utterance: string): Message[] {
    const intent = routeIntent(utterance);
    switch (intent.kind) {
      case "analyze-channel":
        return [
          {
            role: "agent",
            text: `I've started the analysis of ${intent.channelUrl}. This may take two minutes.`,
            tone: "pending",
          },
          {
            role: "agent",
            text: "Honest status: the research worker isn't wired up yet — it lands with Loops 002–003 (Apify scrape + analysis engine). Your request was understood correctly; nothing was silently dropped.",
            tone: "honest-gap",
          },
        ];
      case "list-ideas":
        return [
          {
            role: "agent",
            text: "No stored ideas yet — the ideas table fills up once Loop 003 (analysis engine) ships.",
            tone: "honest-gap",
          },
        ];
      case "help":
        return [
          {
            role: "agent",
            text: "I analyze competitor YouTube channels: paste a channel URL and I'll find outlier videos, then generate titles, video ideas, and thumbnail concepts with evidence. You can also ask me to list your ideas.",
          },
        ];
      case "unknown":
        return [
          {
            role: "agent",
            text: "I didn't catch a channel URL in that. Try pasting a link like youtube.com/@channelname, or ask \"what can you do\".",
          },
        ];
    }
  }

  function send() {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    setMessages((prev) => [...prev, { role: "you", text }, ...agentReply(text)]);
    requestAnimationFrame(() =>
      scrollRef.current?.scrollIntoView({ behavior: "smooth" }),
    );
  }

  return (
    <Card className="flex h-[70vh] w-full flex-col overflow-hidden p-0">
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="flex flex-col gap-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "you"
                  ? "ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                  : "mr-auto max-w-[80%] rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5 text-sm text-foreground"
              }
            >
              {m.tone === "honest-gap" && (
                <Badge variant="outline" className="mb-1.5">
                  not wired yet
                </Badge>
              )}
              <p className="whitespace-pre-wrap">{m.text}</p>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
      <div className="flex items-center gap-2 border-t border-border bg-card px-3 py-3">
        <Button
          variant="outline"
          size="icon"
          title="Voice input arrives with Loop 004 (OpenWhispr bridge)"
          disabled
        >
          🎙️
        </Button>
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Paste a competitor channel URL or ask a question…"
        />
        <Button onClick={send}>Send</Button>
      </div>
    </Card>
  );
}
