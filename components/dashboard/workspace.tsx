"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { routeIntent } from "@/lib/agent/intent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

/* ---------------------------------- types --------------------------------- */

interface Message {
  role: "you" | "agent";
  text: string;
}

interface OutlierResult {
  videoId: string;
  title: string;
  viewCount: number;
  thumbnailUrl: string | null;
  ratio: number;
}

interface Idea {
  kind: "title" | "idea" | "thumbnail-concept";
  text: string;
  evidenceVideoId: string;
}

interface ResearchResult {
  channelUrl: string;
  videosAnalyzed: number;
  outliers: OutlierResult[];
  trueOutliers: boolean;
  ideas: Idea[];
  generator: string;
}

type Phase = "idle" | "awaiting-approval" | "running" | "done" | "error";

/* ----------------------- minimal Web Speech API types ---------------------- */

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

function getRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

let voiceSupportCache: boolean | null = null;
function readVoiceSupport(): boolean {
  if (voiceSupportCache === null) voiceSupportCache = getRecognition() !== null;
  return voiceSupportCache;
}
const noopSubscribe = () => () => {};

/* --------------------------------- sidebar --------------------------------- */

const NAV = [
  { label: "New Research", live: true },
  { label: "Voice Workspace", live: true },
  { label: "Research Sessions", live: false },
  { label: "Competitors", live: false },
  { label: "Videos", live: false },
  { label: "Patterns", live: false },
  { label: "Ideas", live: true },
  { label: "Briefs", live: false },
  { label: "Agent Activity", live: true },
  { label: "Reports", live: false },
  { label: "Usage", live: false },
  { label: "Settings", live: false },
];

/* -------------------------------- component -------------------------------- */

export function Workspace() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "agent",
      text: "Tell me a competitor channel URL. I can research outliers, extract patterns, and prepare sourced ideas.",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [runs, setRuns] = useState(0);
  const [listening, setListening] = useState(false);
  const [voiceReplies, setVoiceReplies] = useState(true);
  const voiceSupported = useSyncExternalStore(noopSubscribe, readVoiceSupport, () => false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const say = useCallback(
    (text: string) => {
      setMessages((prev) => [...prev, { role: "agent", text }]);
      if (voiceReplies && typeof window !== "undefined" && "speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "en-US";
        window.speechSynthesis.speak(u);
      }
    },
    [voiceReplies],
  );

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ------------------------------ agent logic ------------------------------ */

  const handleUtterance = useCallback(
    (text: string) => {
      setMessages((prev) => [...prev, { role: "you", text }]);
      const intent = routeIntent(text);
      switch (intent.kind) {
        case "analyze-channel":
          setPendingUrl(intent.channelUrl);
          setPhase("awaiting-approval");
          say(
            "I can research that channel. Running the Apify scraper costs credits, so I need your approval — check the Approval Guardrails panel.",
          );
          break;
        case "list-ideas":
          say(
            result
              ? `You have ${result.ideas.length} sourced ideas from ${result.channelUrl}. They're listed in the Ideas panel.`
              : "No stored ideas yet — run a channel research first.",
          );
          break;
        case "help":
          say(
            "Paste or say a YouTube channel URL and I'll scrape it with Apify, detect outlier videos deterministically, and prepare sourced title, idea, and thumbnail suggestions.",
          );
          break;
        case "unknown":
          say(
            'I didn\'t catch a channel URL. Try "analyze youtube.com/@channelname", or ask "what can you do".',
          );
      }
    },
    [result, say],
  );

  async function approveAndRun() {
    if (!pendingUrl) return;
    const url = pendingUrl.startsWith("http") ? pendingUrl : `https://${pendingUrl}`;
    setPendingUrl(null);
    setPhase("running");
    say("Approved. I've started the analysis — this may take about a minute.");
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelUrl: url, maxVideos: 15 }),
      });
      const data = (await res.json()) as ResearchResult & { error?: string };
      if (!res.ok || data.error) {
        setPhase("error");
        say(`The research failed honestly rather than silently: ${data.error ?? `HTTP ${res.status}`}`);
        return;
      }
      setResult(data);
      setRuns((r) => r + 1);
      setPhase("done");
      say(
        data.trueOutliers
          ? `Research complete. I analyzed ${data.videosAnalyzed} videos and found ${data.outliers.length} outliers — ${data.ideas.length} sourced ideas are ready in the Ideas panel.`
          : `Research complete. I analyzed ${data.videosAnalyzed} videos; no video beat 2× the channel median, so the ${data.ideas.length} ideas are based on the top performers instead — that's flagged, not hidden.`,
      );
    } catch (err) {
      setPhase("error");
      say(
        `The research failed: ${err instanceof Error ? err.message : "network error"}. Nothing was silently swallowed — retry when ready.`,
      );
    }
  }

  function denyRun() {
    setPendingUrl(null);
    setPhase("idle");
    say("Understood — I won't run the scraper. The request is discarded.");
  }

  function clearData() {
    if (!result && runs === 0) {
      say("There's no research data to delete yet.");
      return;
    }
    setResult(null);
    setPhase("idle");
    say("Local research data cleared. (Nothing is persisted server-side until Supabase lands in Loop 001.)");
  }

  /* -------------------------------- voice io ------------------------------- */

  function startListening() {
    const rec = getRecognition();
    if (!rec) return;
    recognitionRef.current?.abort();
    recognitionRef.current = rec;
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript ?? "";
      if (transcript) handleUtterance(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    setListening(true);
    rec.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  function sendTyped() {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    handleUtterance(text);
  }

  /* --------------------------------- render -------------------------------- */

  const progressSteps: { label: string; state: "done" | "active" | "todo" }[] = [
    { label: "Waiting for request", state: phase === "idle" ? "active" : "done" },
    {
      label: "Approval guardrail",
      state:
        phase === "awaiting-approval" ? "active" : phase === "idle" ? "todo" : "done",
    },
    {
      label: "Apify scrape + outlier detection",
      state: phase === "running" ? "active" : phase === "done" ? "done" : "todo",
    },
    {
      label: "Sourced ideas ready",
      state: phase === "done" ? "done" : "todo",
    },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* ------------------------------ sidebar ------------------------------ */}
      <aside className="hidden w-60 shrink-0 flex-col gap-1 border-r border-border bg-sidebar px-3 py-6 text-sidebar-foreground lg:flex">
        <Link href="/" className="mb-6 flex items-center gap-3 px-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            🎙
          </span>
          <span className="flex flex-col">
            <span className="text-sm font-semibold">YouTube Growth Stack</span>
            <span className="text-xs text-muted-foreground">Voice research agent</span>
          </span>
        </Link>
        {NAV.map((item, i) => (
          <button
            key={item.label}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              i === 0
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/50"
            }`}
            title={item.live ? undefined : "Ships in a later loop — see docs/loops/"}
          >
            {item.label}
            {!item.live && (
              <span className="text-[10px] uppercase tracking-wide opacity-60">soon</span>
            )}
          </button>
        ))}
      </aside>

      {/* ------------------------------- main -------------------------------- */}
      <div className="flex-1 px-4 py-6 sm:px-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Project: Growth Research</h1>
            <p className="text-sm text-muted-foreground">
              Voice: Web Speech API (browser-native) · research: live Apify
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={voiceSupported ? "secondary" : "outline"}>
              {voiceSupported ? "voice ready" : "voice unsupported in this browser"}
            </Badge>
            <Button
              size="sm"
              variant={voiceReplies ? "secondary" : "outline"}
              onClick={() => setVoiceReplies((v) => !v)}
            >
              {voiceReplies ? "Spoken replies on" : "Spoken replies off"}
            </Button>
          </div>
        </header>

        <div className="grid gap-4 xl:grid-cols-2">
          {/* ---------------------- voice + chat workspace --------------------- */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Voice and Chat Workspace</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Voice controls the app. Text remains available for precise edits.
                </p>
              </div>
              <Badge variant="outline">
                {phase === "running" ? "working…" : listening ? "listening…" : "ready"}
              </Badge>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <button
                onClick={listening ? stopListening : startListening}
                disabled={!voiceSupported}
                title={
                  voiceSupported
                    ? listening
                      ? "Stop listening"
                      : "Start voice input"
                    : "This browser has no SpeechRecognition — use Chrome, or type below"
                }
                className={`flex size-24 items-center justify-center rounded-full text-3xl transition-transform ${
                  listening
                    ? "animate-pulse bg-destructive text-white"
                    : "bg-primary text-primary-foreground hover:scale-105"
                } disabled:opacity-40`}
              >
                🎙
              </button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={startListening} disabled={!voiceSupported || listening}>
                  ▷ Start
                </Button>
                <Button variant="outline" size="sm" onClick={stopListening} disabled={!listening}>
                  □ Stop
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    stopListening();
                    startListening();
                  }}
                  disabled={!voiceSupported}
                >
                  ⟳ Retry
                </Button>
              </div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendTyped();
                  }
                }}
                rows={3}
                placeholder="Find outliers in youtube.com/@channel and give me ten ideas…"
                className="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button className="w-full" onClick={sendTyped}>
                Send typed request
              </Button>
            </CardContent>
          </Card>

          {/* --------------------------- live workspace ------------------------ */}
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Live Workspace</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Evidence, progress, and ideas appear here while the agent works.
                </p>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-3">
                {[
                  { label: "Research runs", value: runs },
                  { label: "Outliers found", value: result?.outliers.length ?? 0 },
                  { label: "Ideas scored", value: result?.ideas.length ?? 0 },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-border bg-muted/40 p-4">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="mt-1 text-3xl font-semibold tabular-nums">{s.value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Progress</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">User-safe status only</p>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {progressSteps.map((s) => (
                    <div key={s.label} className="flex items-center gap-2 text-sm">
                      <span
                        className={
                          s.state === "done"
                            ? "text-primary"
                            : s.state === "active"
                              ? "animate-pulse text-primary"
                              : "text-muted-foreground/50"
                        }
                      >
                        {s.state === "done" ? "✓" : s.state === "active" ? "●" : "○"}
                      </span>
                      <span className={s.state === "todo" ? "text-muted-foreground/60" : ""}>
                        {s.label}
                      </span>
                    </div>
                  ))}
                  {phase === "error" && (
                    <p className="text-sm text-destructive">Last run failed — see the transcript.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Approval Guardrails</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Expensive actions require confirmation
                  </p>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                    <span>Run Apify scraper</span>
                    {phase === "awaiting-approval" ? (
                      <span className="flex gap-1">
                        <Button size="sm" onClick={approveAndRun}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={denyRun}>
                          Deny
                        </Button>
                      </span>
                    ) : (
                      <Badge variant="outline">approval required</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                    <span>Start Firecrawl crawl</span>
                    <Badge variant="outline" title="Enrichment ships with Loop 003">
                      soon
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                    <span>Store raw audio</span>
                    <Badge variant="outline">off by default</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                    <span>Delete research data</span>
                    <Button size="sm" variant="outline" onClick={clearData}>
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ---------------------------- conversation ------------------------- */}
          <Card>
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Persistent transcript and agent status
              </p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64 pr-3">
                <div className="flex flex-col gap-3">
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={
                        m.role === "you"
                          ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                          : "mr-auto max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5 text-sm"
                      }
                    >
                      <p className="mb-0.5 text-[10px] uppercase tracking-wide opacity-60">
                        {m.role === "you" ? "You" : "Agent"}
                      </p>
                      <p className="whitespace-pre-wrap">{m.text}</p>
                    </div>
                  ))}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* ------------------------------- ideas ------------------------------ */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Ideas</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {result
                    ? `${result.videosAnalyzed} videos analyzed · ${result.generator}`
                    : "Sourced suggestions land here after a research run."}
                </p>
              </div>
              {result && !result.trueOutliers && (
                <Badge variant="outline">based on top videos — no 2× outliers</Badge>
              )}
            </CardHeader>
            <CardContent>
              {result ? (
                <ScrollArea className="h-64 pr-3">
                  <div className="flex flex-col gap-2">
                    {result.outliers.length > 0 && (
                      <>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Outlier evidence
                        </p>
                        {result.outliers.map((o) => (
                          <div
                            key={o.videoId}
                            className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                          >
                            <span className="line-clamp-1">{o.title}</span>
                            <Badge variant="secondary" className="tabular-nums">
                              {o.ratio}×
                            </Badge>
                          </div>
                        ))}
                        <Separator className="my-2" />
                      </>
                    )}
                    {result.ideas.map((idea, i) => (
                      <div key={i} className="rounded-lg border border-border px-3 py-2 text-sm">
                        <Badge variant="outline" className="mb-1">
                          {idea.kind}
                        </Badge>
                        <p>{idea.text}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
                  <span className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-2xl">
                    🎙
                  </span>
                  <p className="font-medium">Start with your voice</p>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Ask the agent to analyze a competitor channel. Research is live —
                    the Apify scraper runs for real once you approve it.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
