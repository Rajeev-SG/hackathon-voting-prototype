# Viewport UX Audit

Date: `2026-03-24`

Scope:

- public scoreboard layout
- mobile density and above-the-fold priority
- board-view controls
- scoreboard header copy and chips
- cross-viewport visual rhythm
- vote-flow usability re-check via fresh Playwright proof

Method:

- heuristic review using content-priority, scanability, disclosure, and reachability checks
- fresh local and production Playwright runs after the mobile-density change
- screenshot review across mobile, mid-width, tablet, and wide desktop

## What changed

The mobile scoreboard now treats supporting chrome as secondary. On small screens:

- the scoreboard summary details start collapsed
- the board-view switcher starts collapsed
- opening either surface uses an overlay panel instead of pushing the table farther down
- the first scoreboard row stays visible sooner in the initial scan

## Screenshots reviewed

- `artifacts/ux-audit/gh-30/prod-mobile-public.png`
- `artifacts/ux-audit/gh-30/prod-mid-public.png`
- `artifacts/ux-audit/gh-30/local-tablet-public.png`
- `artifacts/ux-audit/gh-30/prod-wide-desktop-public.png`

## Viewport findings

### Mobile

Verdict:

- Pass

What is working:

- header/nav stays compact enough that the scoreboard heading and first row arrive much earlier
- supporting board metadata is hidden by default, which reduces pre-scroll cognitive load
- the board-view control no longer burns a full card above the table when the user has not asked for it
- the scoreboard remains readable in the first scan without sacrificing access to detail

Why it is safer:

- the supporting sections use progressive disclosure instead of permanent vertical space
- those panels open over the UI rather than reflowing the table downward, so the board position stays predictable

### Mid-width

Verdict:

- Pass

What is working:

- the single-column reading order holds
- the scoreboard intro and controls feel intentional instead of stretched
- chips, heading, and table/chart controls have enough breathing room without creating a dead zone

### Tablet

Verdict:

- Pass

What is working:

- the layout still reads top-to-bottom without accidental competition between panels
- the scoreboard remains the dominant block
- spacing is calmer than mobile while preserving the same mental model

### Wide desktop

Verdict:

- Pass

What is working:

- the page no longer spends its strongest real estate on explanatory support copy
- the scoreboard section stays visually dominant
- supporting status information is compact and subordinate

## Usability audit summary

### Information hierarchy

- Pass
- The app now puts the board ahead of explanatory chrome on every viewport.

### Progressive disclosure

- Pass
- Small screens hide optional detail until the user asks for it.

### Task continuity

- Pass
- Opening summary or board-view detail does not shove the scoreboard down the page.

### Cognitive load

- Pass
- Users see fewer choices before reaching the board, especially on mobile.

### Consistency

- Pass
- The same single-column hierarchy now survives from mobile through desktop.

### Reachability

- Pass
- Fresh Playwright proof confirmed the collapsed sections can still be opened, used, and dismissed, and the scoreboard remains usable afterward.

## Residual risk

- The mobile experience is materially better, but long project names or unusually large team names can still increase row height and make the first visible row denser than the proof fixture. That is a normal content-variance risk, not a structural layout failure.

## Validation used for this audit

```bash
pnpm check
pnpm build
E2E_BASE_URL=http://localhost:3017 pnpm exec playwright test tests/e2e/single-screen-voting.spec.ts --project=desktop-light --reporter=list
E2E_BASE_URL=http://localhost:3017 pnpm exec playwright test tests/e2e/single-screen-voting.spec.ts --project=mobile-dark --reporter=list
LAYOUT_PROOF=1 E2E_BASE_URL=http://localhost:3017 pnpm exec playwright test tests/e2e/scoreboard-breakpoints.spec.ts --reporter=list
curl -I https://vote.rajeevg.com
E2E_BASE_URL=https://vote.rajeevg.com E2E_JUDGE_AUTH_MODE=ticket pnpm exec playwright test tests/e2e/single-screen-voting.spec.ts --reporter=list
LAYOUT_PROOF=1 E2E_BASE_URL=https://vote.rajeevg.com pnpm exec playwright test tests/e2e/scoreboard-breakpoints.spec.ts --reporter=list
```

## Overall verdict

- Pass

The mobile-first density change did what it needed to do: it restored the scoreboard as the first meaningful destination on small screens without hiding useful controls or breaking the desktop experience.
