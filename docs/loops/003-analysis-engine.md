# Loop 003 — Analysis engine: outliers → titles, ideas, thumbnail concepts

**Phase:** 2 · **Status:** todo

## Goal

From one channel's stored raw data, detect outlier videos and generate 10
usable suggestions (titles + ideas + thumbnail concepts), stored in `ideas`.

## Scope

- Included: `lib/analysis/` implementation (outlier detection is
  deterministic code; only creative generation uses the LLM), persistence
- Not included: UI, voice

## Steps

1. Deterministic first: compute view-ratio outliers in plain TypeScript
   (cheap, testable), pass only outliers to the LLM step.
2. Generate titles/ideas/thumbnail concepts; store in `ideas` with the
   evidence (which outlier inspired it).

## Verify

- [ ] One real channel produces ≥10 stored suggestions with evidence links
- [ ] Outlier detection has a unit-style check with fixed input → fixed output
- [ ] `npm run build` passes

## Ship

Branch `feature/analysis-engine` → PR → review → merge.
