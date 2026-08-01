import Link from "next/link";
import { Conversation } from "@/components/conversation";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Dashboard — YouTube Growth Stack" };

export default function DashboardPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 bg-background px-6 py-10 text-foreground">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <Link href="/" className="text-sm text-muted-foreground hover:underline">
            ← YouTube Growth Stack
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            Talk to your growth agent
          </h1>
        </div>
        <Badge variant="secondary">voice coming in Loop 004</Badge>
      </header>
      <Conversation />
      <p className="text-center text-xs text-muted-foreground">
        Intent routing is live. Research, ideas, and voice ship with Loops
        002–004 — progress is tracked openly in docs/loops/.
      </p>
    </main>
  );
}
