---
name: add-ui-page
description: Add a new page/screen to the Next.js app using the TweakCN theme and existing component conventions. Use whenever a loop asks for a new route, screen, or dashboard section.
---

# Add a UI page

## Steps

1. **Route** — create `app/<route>/page.tsx`. Server component by default;
   split interactive parts into a `"use client"` child component.
2. **Components** — check `components/ui/` first; reuse before creating.
   If a new ShadCN component is needed: `npx shadcn@latest add <component>`.
3. **Styling** — use only theme tokens from `app/globals.css`
   (e.g. `bg-background`, `text-foreground`, `text-muted-foreground`,
   `bg-primary`, `border-border`). Never hardcode hex colors or font names.
4. **Data** — fetch in the server component via `lib/` clients; pass plain
   props down. No direct `fetch` to third-party APIs from client components.
5. **Navigation** — if the page is user-facing, add a link to it from the
   dashboard shell.

## Verify

- `npm run build` passes.
- `npm run lint` passes.
- Page renders at its route with `npm run dev` (check the terminal for errors).

## Boundaries

- Do not modify `app/globals.css` theme tokens in this skill's scope.
- Do not add new npm dependencies without noting it in the PR description.
