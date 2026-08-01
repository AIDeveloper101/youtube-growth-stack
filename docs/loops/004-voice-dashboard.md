# Loop 004 — Voice-native conversation dashboard

**Phase:** 3 · **Status:** todo

## Goal

The dashboard is a conversation: user speaks or types, agent acknowledges
instantly, works in the background, then speaks the result.

## Scope

- Included: chat UI (`app/dashboard/`), OpenWhispr bridge (`lib/voice/`),
  agent intent routing (`lib/agent/`), async job status
- Not included: payments

## Steps

1. Follow skill `add-ui-page` for the dashboard shell (TweakCN theme tokens).
2. Wire `lib/voice/openwhispr.ts` STT input → `lib/agent/intent.ts` →
   background worker → TTS reply.
3. Latency rule: acknowledge within ~1s ("Started — this may take two
   minutes"), never leave silence while research runs.

## Verify

- [ ] Say/type "analyze <channel>" → acknowledgment appears immediately
- [ ] On completion the agent replies with real generated ideas (spoken + text)
- [ ] `npm run build` passes

## Ship

Branch `feature/voice-dashboard` → PR → review → merge.
