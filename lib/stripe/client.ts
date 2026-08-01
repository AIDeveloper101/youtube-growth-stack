/**
 * Stripe subscription helpers. Implemented in Phase 4 — until then the app
 * treats every user as free-tier with hard quotas (ADR 0001: costs are
 * controlled by cache + quotas, priced into plans later).
 */
export const FREE_TIER_ANALYSES_PER_DAY = 2;

export function stripeSecretKey(): string {
  const k = process.env.STRIPE_SECRET_KEY;
  if (!k) throw new Error("STRIPE_SECRET_KEY is not set (see .env.example)");
  return k;
}
