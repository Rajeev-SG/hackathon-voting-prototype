# Viewport UX Audit

Date: `2026-03-24`

Scope:

- mobile scoreboard details and board-view controls
- above-the-fold priority on the public board
- single-column hierarchy across mobile, mid-width, tablet, and wide desktop
- touch, pointer, and keyboard-adjacent reachability for the mobile disclosure surfaces

## Audit outcome

Overall verdict:

- Pass, after fixing a real mobile interaction defect

What failed before this pass:

- the mobile scoreboard `Details` and `Board view` controls were implemented as custom absolute overlays
- that pattern was too brittle for event-day confidence
- once reproduced under focused mobile proof, the disclosure surface could land off-screen and its close affordance could sit outside the viewport

What changed:

- the mobile `Details` and `Board view` controls now open as anchored bottom-sheet dialogs rather than ad hoc absolute panels
- the sheets are scroll-safe, viewport-bounded, and easier to dismiss
- the signed-out public snapshot cache is disabled for local Playwright proof runs so mobile acceptance evidence is not polluted by stale anonymous state
- a dedicated mobile-controls acceptance spec now exists in [/Users/rajeev/Code/hackathon-voting-prototype/tests/e2e/mobile-scoreboard-controls.spec.ts](/Users/rajeev/Code/hackathon-voting-prototype/tests/e2e/mobile-scoreboard-controls.spec.ts)

Authoritative implementation paths:

- [/Users/rajeev/Code/hackathon-voting-prototype/components/results-dashboard.tsx](/Users/rajeev/Code/hackathon-voting-prototype/components/results-dashboard.tsx)
- [/Users/rajeev/Code/hackathon-voting-prototype/components/results-scoreboard-table.tsx](/Users/rajeev/Code/hackathon-voting-prototype/components/results-scoreboard-table.tsx)
- [/Users/rajeev/Code/hackathon-voting-prototype/components/ui/dialog.tsx](/Users/rajeev/Code/hackathon-voting-prototype/components/ui/dialog.tsx)
- [/Users/rajeev/Code/hackathon-voting-prototype/lib/competition.ts](/Users/rajeev/Code/hackathon-voting-prototype/lib/competition.ts)
- [/Users/rajeev/Code/hackathon-voting-prototype/playwright.config.ts](/Users/rajeev/Code/hackathon-voting-prototype/playwright.config.ts)

## Evidence reviewed

Collapsed-state screenshots:

- [/Users/rajeev/Code/hackathon-voting-prototype/artifacts/ux-audit/gh-39/local-mobile-public.png](/Users/rajeev/Code/hackathon-voting-prototype/artifacts/ux-audit/gh-39/local-mobile-public.png)
- [/Users/rajeev/Code/hackathon-voting-prototype/artifacts/ux-audit/gh-39/local-wide-desktop-public.png](/Users/rajeev/Code/hackathon-voting-prototype/artifacts/ux-audit/gh-39/local-wide-desktop-public.png)
- [/Users/rajeev/Code/hackathon-voting-prototype/artifacts/ux-audit/gh-39/prod-mobile-public.png](/Users/rajeev/Code/hackathon-voting-prototype/artifacts/ux-audit/gh-39/prod-mobile-public.png)
- [/Users/rajeev/Code/hackathon-voting-prototype/artifacts/ux-audit/gh-39/prod-mid-public.png](/Users/rajeev/Code/hackathon-voting-prototype/artifacts/ux-audit/gh-39/prod-mid-public.png)
- [/Users/rajeev/Code/hackathon-voting-prototype/artifacts/ux-audit/gh-39/prod-wide-desktop-public.png](/Users/rajeev/Code/hackathon-voting-prototype/artifacts/ux-audit/gh-39/prod-wide-desktop-public.png)

Open-state mobile sheet screenshots:

- [/Users/rajeev/Code/hackathon-voting-prototype/artifacts/ux-audit/gh-39/local-mobile-summary-open.png](/Users/rajeev/Code/hackathon-voting-prototype/artifacts/ux-audit/gh-39/local-mobile-summary-open.png)
- [/Users/rajeev/Code/hackathon-voting-prototype/artifacts/ux-audit/gh-39/local-mobile-view-open.png](/Users/rajeev/Code/hackathon-voting-prototype/artifacts/ux-audit/gh-39/local-mobile-view-open.png)
- [/Users/rajeev/Code/hackathon-voting-prototype/artifacts/ux-audit/gh-39/prod-mobile-summary-open.png](/Users/rajeev/Code/hackathon-voting-prototype/artifacts/ux-audit/gh-39/prod-mobile-summary-open.png)
- [/Users/rajeev/Code/hackathon-voting-prototype/artifacts/ux-audit/gh-39/prod-mobile-view-open.png](/Users/rajeev/Code/hackathon-voting-prototype/artifacts/ux-audit/gh-39/prod-mobile-view-open.png)

## Viewport findings

### Mobile

Verdict:

- Pass

What is working now:

- the scoreboard heading and first row remain in the initial scan
- both disclosure controls are compact when closed
- opening either control uses a proper bottom sheet that overlaps the UI instead of pushing the scoreboard down
- the close affordance and the sheet body remain within the viewport
- chart/table switching works from the sheet and returns the user to the board in the selected view

Why this is safer:

- the dialog-based sheet uses Radix focus and dismissal behavior instead of custom outside-click plumbing
- the sheet can be closed by the visible close button, the overlay, or escape-like browser interactions

### Mid-width

Verdict:

- Pass

What is working:

- the one-column reading order holds
- the board remains dominant over supporting chrome
- controls do not create a dead zone above the first rows

### Tablet

Verdict:

- Pass

What is working:

- the same mental model survives into the larger canvas
- disclosure and board controls stay subordinate to the ranking itself

### Wide desktop

Verdict:

- Pass

What is working:

- the board remains the first meaningful destination
- secondary state chips and controls feel compact instead of theatrical

## Interaction audit summary

### Mobile details sheet

- Pass
- Opened, rendered, and dismissed cleanly on local production and the live site.

### Mobile board-view sheet

- Pass
- Opened cleanly and successfully switched between table and chart on local production and the live site.

### Public-state consistency

- Pass
- The public board kept the same mobile disclosure behavior after the manager seeded real entries on production.

### Proof-rig trustworthiness

- Improved
- Local anonymous snapshot caching is now disabled during Playwright proof runs so event-day audits are based on live database state rather than stale signed-out cache.

## Residual risk

- Content variance is still the main residual risk. Very long project names or unusually long summaries can make the first visible row denser than the proof fixture, but the disclosure surfaces themselves are now structurally robust.

## Validation used for this audit

```bash
pnpm check
pnpm build
E2E_BASE_URL=http://localhost:3017 pnpm exec playwright test tests/e2e/mobile-scoreboard-controls.spec.ts --project=mobile-dark --reporter=list
LAYOUT_PROOF=1 E2E_BASE_URL=http://localhost:3017 pnpm exec playwright test tests/e2e/scoreboard-breakpoints.spec.ts --reporter=list
vercel --prod --yes
curl -I https://vote.rajeevg.com
set -a && source .env.vercel-prod && set +a && E2E_BASE_URL=https://vote.rajeevg.com pnpm exec playwright test tests/e2e/mobile-scoreboard-controls.spec.ts --project=mobile-dark --reporter=list
LAYOUT_PROOF=1 E2E_BASE_URL=https://vote.rajeevg.com pnpm exec playwright test tests/e2e/scoreboard-breakpoints.spec.ts --reporter=list
```

## Final note

This audit is stronger than the earlier mobile-density pass because it found and fixed a real reachability bug before sign-off instead of assuming the existing overlay pattern was good enough.
