# Proof

## Local proof

Date: `2026-03-24`

Surface: local production build via `next start`

Command set:

```bash
pnpm test
pnpm build
pnpm check
pnpm test:e2e
```

Playwright projects:

- `desktop-light`
- `mobile-dark`

Flows proven:

- Anonymous user can view the scoreboard but not manager controls
- Manager downloads the XLSX template
- Manager uploads a workbook and workbook-driven entries appear
- Manager switches the scoreboard between table and horizontal bar-chart views
- Manager begins voting
- Manager closes and reopens an individual project for new voting
- Judge signs in with email-code auth
- The mobile email-code auth flow survives a page remount and returns to the verification step instead of resetting to email entry
- Vote modal supports keyboard selection and submission
- Judge is locked out from changing a project after submitting the first vote
- Self-voting is blocked for matching team emails
- Progress reaches completion under the documented denominator rule
- Manager finalizes the round
- Manager downloads the finalized XLSX export
- Public finalized state is visible and modal voting is locked
- The judging-progress state card keeps its label fully contained at mobile and wide desktop widths
- The scoreboard remains visually ahead of the progress section, and the progress section stays below the board across breakpoints

Artifacts:

- Playwright report directory: `artifacts/playwright-report`
- Playwright screenshots and traces: `artifacts/playwright/`
- Section-focused local production screenshots for the judging-progress header: `artifacts/manual-proof/`

Result:

- Pass

## Readiness hardening proof

Date: `2026-03-24`

Surface:

- local production logic
- `https://vote.rajeevg.com`

Commands:

```bash
pnpm exec vitest run tests/xlsx.test.ts tests/competition-logic.test.ts tests/votes.integration.test.ts tests/readiness.integration.test.ts --reporter=verbose
pnpm exec vitest run tests/readiness.integration.test.ts --reporter=dot
pnpm exec vitest run tests/readiness.integration.test.ts --reporter=dot
pnpm exec vitest run tests/readiness.integration.test.ts --reporter=dot
pnpm check
pnpm build
pnpm exec playwright test tests/e2e/single-screen-voting.spec.ts --reporter=list
pnpm readiness:public -- --url https://vote.rajeevg.com --concurrency 50 --requests 500
```

Behavior and resilience proof:

- XLSX parsing/export edge cases pass
- completion, self-vote blocking, one-vote lock, and manager tracker logic pass
- the 50-judge readiness simulation passed in the full suite
- the same readiness simulation then passed three consecutive standalone reruns
- the full desktop and mobile single-screen browser flow still passed after the vote-path hardening
- the live public-read probe passed against `vote.rajeevg.com` with `50` concurrent requests and `500` total requests, `0` failures, `p50 153.42ms`, `p95 309.21ms`, and `p99 455.01ms`

Why this pass mattered:

- readiness testing had surfaced intermittent `Voting is not currently open` and missing-entry failures right after round-open or entry creation under stress
- the vote path was hardened to tolerate a short read-after-write consistency window before failing

Result:

- Pass

## Focused scoreboard polish proof

Date: `2026-03-24`

Goal:

- Re-check the single-column ordering after removing the old side rail and ensure progress stays below the scoreboard cleanly

Local production surface:

- `http://127.0.0.1:3002` via `pnpm build` then `pnpm start --port 3002`

Production surface:

- `https://vote.rajeevg.com`

Focused proof artifacts:

- `artifacts/manual-proof/mobile-430-prod-start.png`
- `artifacts/manual-proof/desktop-1575-prod-start.png`
- `artifacts/manual-proof/mobile-430-production.png`
- `artifacts/manual-proof/desktop-1575-production.png`

Observed result:

- The state card now renders `Preparing` instead of the raw uppercase enum token.
- Mobile at `430px` keeps the progress cards readable without clipping or overlap.
- Wide desktop at `1575px` keeps the scoreboard dominant instead of splitting attention with a side rail.
- DOM measurement on both local production and the live site confirmed the state label stayed inset inside its card with healthy top and bottom space.

Result:

- Pass

## Intermediate breakpoint scoreboard proof

Date: `2026-03-24`

Goal:

- Prove the single-column scoreboard keeps the board above the progress section and stays contained at the in-between widths where the live site previously clipped

Local validation:

```bash
pnpm exec playwright test tests/e2e/scoreboard-breakpoints.spec.ts --reporter=list
```

Viewports covered:

- `480px`
- `560px`
- `768px`
- `1575px`

Proof contract:

- No horizontal page overflow
- Progress panel appears below the scoreboard section
- State card remains inside the viewport
- State label keeps healthy top and bottom inset inside the card
- Mid-width layouts keep the one-column reading order without accidental side-by-side competition

Artifacts:

- `artifacts/manual-proof/gh-14/local-fresh-480.png`
- `artifacts/manual-proof/gh-14/local-fresh-560.png`
- `artifacts/manual-proof/gh-14/local-fresh-768.png`
- `artifacts/manual-proof/gh-14/local-fresh-1575.png`
- `artifacts/manual-proof/gh-14/live-progress-480.png`
- `artifacts/manual-proof/gh-14/live-progress-560.png`
- `artifacts/manual-proof/gh-14/live-progress-1575.png`

Result:

- Pass

## Layout hierarchy proof

Date: `2026-03-24`

Goal:

- Rebalance the screen so the scoreboard and next action dominate above the fold instead of a large explanatory hero or side rail

Guidance used:

- GOV.UK layout guidance informed the simplification and content-first structure: [Layout – GOV.UK Design System](https://design-system.service.gov.uk/styles/layout/)
- Atlassian messaging guidance informed the shorter supporting copy and empty-state wording: [Info messages – Atlassian Design](https://atlassian.design/foundations/content/designing-messages/info-messages/)

Local visual proof:

- Surface: `http://127.0.0.1:3005`
- Command set:

```bash
pnpm exec playwright screenshot --wait-for-selector "[data-testid='scoreboard-section']" --wait-for-timeout 1200 --viewport-size "1575,1100" --color-scheme light http://127.0.0.1:3005 artifacts/layout-proof/local-wide-desktop.png
pnpm exec playwright screenshot --wait-for-selector "[data-testid='scoreboard-section']" --wait-for-timeout 1200 --viewport-size "560,900" --color-scheme dark http://127.0.0.1:3005 artifacts/layout-proof/local-mid.png
pnpm exec playwright screenshot --wait-for-selector "[data-testid='scoreboard-section']" --wait-for-timeout 1200 --viewport-size "430,932" --color-scheme dark http://127.0.0.1:3005 artifacts/layout-proof/local-mobile.png
```

Observed local result:

- Wide desktop no longer burns most of the first screen on a tall empty hero.
- The scoreboard header and first rows now appear in the primary scan area instead of being pushed too far down.
- Mid-width and mobile now carry only the decision-driving summary above the fold, with the board appearing sooner and progress staying below it.
- Supporting rules remain present but visually secondary.

Artifacts:

- `artifacts/layout-proof/local-wide-desktop.png`
- `artifacts/layout-proof/local-mid.png`
- `artifacts/layout-proof/local-mobile.png`

Production layout proof:

- Surface: `https://vote.rajeevg.com`
- Command set:

```bash
pnpm exec playwright screenshot --wait-for-selector "[data-testid='scoreboard-section']" --wait-for-timeout 1200 --viewport-size "1575,1100" --color-scheme light https://vote.rajeevg.com artifacts/layout-proof/prod-wide-desktop.png
pnpm exec playwright screenshot --wait-for-selector "[data-testid='scoreboard-section']" --wait-for-timeout 1200 --viewport-size "560,900" --color-scheme dark https://vote.rajeevg.com artifacts/layout-proof/prod-mid.png
pnpm exec playwright screenshot --wait-for-selector "[data-testid='scoreboard-section']" --wait-for-timeout 1200 --viewport-size "430,932" --color-scheme dark https://vote.rajeevg.com artifacts/layout-proof/prod-mobile.png
LAYOUT_PROOF=1 E2E_BASE_URL=https://vote.rajeevg.com pnpm exec playwright test tests/e2e/scoreboard-breakpoints.spec.ts --reporter=list
```

Observed production result:

- Wide desktop keeps the scoreboard and first action in the dominant scan path without the old dead-zone hero feeling.
- Mid-width and mobile preserve the same reading order, expose the scoreboard sooner, and keep progress below the board.
- The focused breakpoint proof passed on the live app across the intentional desktop, tablet, mid-width, and mobile combinations.

Production artifacts:

- `artifacts/layout-proof/prod-wide-desktop.png`
- `artifacts/layout-proof/prod-mid.png`
- `artifacts/layout-proof/prod-mobile.png`

## Event-day readiness proof

Date: `2026-03-23`

Goal:

- Verify the app is credible for a room-sized judging session without paying for heavyweight load tooling

Command set:

```bash
pnpm test tests/readiness.integration.test.ts
pnpm readiness:public -- --url https://vote.rajeevg.com --concurrency 50 --requests 250
```

What this covers:

- `tests/readiness.integration.test.ts` exercises the real Prisma-backed voting rules with 50 concurrent judges voting in project-by-project waves.
- The readiness test also proves the self-vote denominator stays correct when some judges are blocked from some entries.
- `readiness:public` applies 50 concurrent public GETs and 250 total scoreboard requests against production to catch obvious response degradation or broken HTML under spectator traffic.
- The main Playwright journey now additionally proves that one device sees another device's score change without a manual reload.

Limitations:

- This is a practical readiness pass, not a full synthetic internet-scale soak test.
- It does not emulate 50 fully interactive browsers continuously animating at once.
- It does provide strong evidence for the actual risks that matter here: concurrent voting writes, public read pressure, cross-device freshness, and the mobile/desktop user journey.

## Production proof

Date: `2026-03-23`

Surface: `https://vote.rajeevg.com`

Command:

```bash
E2E_BASE_URL=https://vote.rajeevg.com E2E_JUDGE_AUTH_MODE=ticket pnpm test:e2e
```

Viewports exercised:

- `desktop-light`
- `mobile-dark`

Behavior proof:

- Public scoreboard is reachable without auth
- Judges do not see manager-only controls or manager framing in the summary surface
- Manager template download, workbook upload, begin-voting, per-entry close / reopen, finalization, and export all complete successfully
- Manager remaining-votes tracker updates after the first submitted vote and mirrors the live completion denominator
- Scoreboard table and horizontal bar-chart modes both render correctly
- The vote modal opens from the scoreboard, accepts keyboard score selection, submits successfully, and then locks the judge out from changing that project
- Self-vote blocking is enforced from uploaded team emails
- Finalized public state locks the modal and keeps the scoreboard readable

Design proof notes:

- Desktop uses the full width well without horizontal overflow
- Mobile layout preserves the single-screen journey and keeps the modal legible and tappable
- The modal remains the visual center of the flow on both viewports while fitting above the fold in the judge proof run
- The judging-progress state card now uses a friendly label plus helper copy, and fresh section proof confirmed no clipping or overlap in the status area

Artifacts:

- Playwright report directory: `artifacts/playwright-report`
- Playwright screenshots and traces: `artifacts/playwright/`

Result:

- Pass

## Manual production auth proof

Date: `2026-03-23`

Surface: `https://vote.rajeevg.com`

Method:

- Live browser proof through the existing Chrome session via CDP

Auth journeys proven:

- Google OAuth sign-in completed on production and returned to the app as a signed-in judge
- Email-code sign-in completed on production using a real inbox delivery
- The live verification email arrived branded as `Hackathon Voting App <notifications@vote.rajeevg.com>`
- The email content clearly identified the app, displayed the one-time code, and the received code successfully signed the user back into the production app

Result:

- Pass

## Production auth notes

- Production Clerk now runs in live mode on `vote.rajeevg.com`, replacing the earlier development-instance setup that returned `x-clerk-auth-reason: dev-browser-missing`.
- Google OAuth is configured on the production Clerk instance for `https://clerk.vote.rajeevg.com/v1/oauth_callback`.
- The live production verification email is already understandable and app-branded through the Clerk application name and production sending domain.
- Production verification-email template editing is still blocked by Clerk's current Hobby plan. Deeper subject/body template edits require a plan upgrade or custom delivery.
