import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    title: "Ask out loud",
    body: "Paste a competitor channel or just say it. The agent understands intent and gets to work.",
  },
  {
    title: "Research runs for you",
    body: "Apify and Firecrawl collect the data; outlier detection finds what actually worked.",
  },
  {
    title: "Ideas, spoken back",
    body: "Titles, video ideas, and thumbnail concepts — each linked to the evidence that inspired it.",
  },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-6 py-24 text-foreground">
      <div className="flex w-full max-w-3xl flex-col items-center gap-6 text-center">
        <Badge variant="secondary">Open source · MIT · Voice-native</Badge>
        <h1 className="text-balance text-5xl font-semibold tracking-tight sm:text-6xl">
          YouTube Growth Stack
        </h1>
        <p className="max-w-xl text-pretty text-lg text-muted-foreground">
          Talk to your agent. It analyzes competitor channels, finds outlier
          videos, and speaks back titles, ideas, and thumbnail concepts.
        </p>
        <Button asChild size="lg">
          <Link href="/dashboard">Open the dashboard</Link>
        </Button>
      </div>

      <div className="mt-20 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
        {steps.map((step, i) => (
          <Card key={step.title}>
            <CardContent className="flex flex-col gap-2 pt-6">
              <span className="font-mono text-xs text-muted-foreground">
                0{i + 1}
              </span>
              <h2 className="font-medium">{step.title}</h2>
              <p className="text-sm text-muted-foreground">{step.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
