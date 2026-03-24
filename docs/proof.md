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
- The scoreboard remains the dominant first-read surface after the redundant manager-summary and judging-progress panels were removed
- The compact vote modal fits above the fold on both proof viewports without redundant instructional blocks

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

- Re-check the single-column ordering after removing the old side rail and keeping the scoreboard as the dominant first-read surface

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

- The state badge now renders `Preparing` instead of the raw uppercase enum token.
- Mobile at `430px` keeps the scoreboard header and first board section readable without clipping or overlap.
- Wide desktop at `1575px` keeps the scoreboard dominant instead of splitting attention with a side rail.
- DOM measurement on both local production and the live site confirmed the compact state badge stayed within the viewport with no overflow.

Result:

- Pass

## Intermediate breakpoint scoreboard proof

Date: `2026-03-24`

Goal:

- Prove the single-column scoreboard stays contained at the in-between widths where the live site previously clipped

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
- No redundant summary or progress panel remains on the page
- State badge remains inside the viewport
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

Result:

- Pass

## Mobile density and viewport audit

Date: `2026-03-24`

Goal:

- keep the scoreboard visible sooner on mobile by collapsing secondary summary and board-view surfaces by default
- ensure those supporting panels expand as overlays instead of pushing the scoreboard down the page
- re-audit the visual hierarchy across mobile, mid-width, tablet, and desktop

Local validation:

```bash
pnpm check
pnpm build
E2E_BASE_URL=http://localhost:3017 pnpm exec playwright test tests/e2e/single-screen-voting.spec.ts --project=desktop-light --reporter=list
E2E_BASE_URL=http://localhost:3017 pnpm exec playwright test tests/e2e/single-screen-voting.spec.ts --project=mobile-dark --reporter=list
LAYOUT_PROOF=1 E2E_BASE_URL=http://localhost:3017 pnpm exec playwright test tests/e2e/scoreboard-breakpoints.spec.ts --reporter=list
```

Production validation:

```bash
curl -I https://vote.rajeevg.com
E2E_BASE_URL=https://vote.rajeevg.com E2E_JUDGE_AUTH_MODE=ticket pnpm exec playwright test tests/e2e/single-screen-voting.spec.ts --reporter=list
LAYOUT_PROOF=1 E2E_BASE_URL=https://vote.rajeevg.com pnpm exec playwright test tests/e2e/scoreboard-breakpoints.spec.ts --reporter=list
```

What the proof checked:

- mobile summary and board-view panels are collapsed by default
- the mobile controls can still be opened and used
- the first scoreboard row remains visible sooner in the mobile first scan
- the same single-column hierarchy holds through mid-width, tablet, and wide desktop
- manager, judge, and public journeys still complete on production after the density change

Audit artifacts:

- `artifacts/ux-audit/gh-30/prod-mobile-public.png`
- `artifacts/ux-audit/gh-30/prod-mid-public.png`
- `artifacts/ux-audit/gh-30/local-tablet-public.png`
- `artifacts/ux-audit/gh-30/prod-wide-desktop-public.png`

Audit note:

- `docs/viewport-ux-audit.md`

Observed result:

- mobile now defers secondary scoreboard chrome until requested, which lifts the board higher without hiding functionality
- opened supporting panels overlay the page instead of reflowing the scoreboard downward
- mid-width, tablet, and desktop retain the simplified single-column reading order
- production desktop and mobile end-to-end flows remained green after the change

Result:

- Pass

## Analytics stack completion proof

Date: `2026-03-24`

Goal:

- remove the Stape GTM MCP tab-spam path from the active rig
- prove the replacement GTM MCP endpoint works under `rajeev.sgill@gmail.com`
- prove the BigQuery reporting refresh is healthy
- prove a real Looker Studio reporting shell exists and is attached to the reporting dataset

Commands and checks:

```bash
codex mcp list | rg 'gtm_mcp|analytics_mcp|chrome_devtools'
bq show --format=prettyjson personal-gws-1:ga4_498363924
bq show --format=prettyjson personal-gws-1:hackathon_reporting
bq show --transfer_config projects/401448512581/locations/europe/transferConfigs/69d1795c-0000-21c1-bcb2-24058877ff20
bq ls --transfer_run projects/401448512581/locations/europe/transferConfigs/69d1795c-0000-21c1-bcb2-24058877ff20
bq ls --transfer_log projects/401448512581/locations/europe/transferConfigs/69d1795c-0000-21c1-bcb2-24058877ff20/runs/69e03509-0000-2f53-ba6d-001a114b97f0
```

Observed result:

- Codex now points `gtm_mcp` at `https://mcp.gtmeditor.com`
- no `gtm-mcp.stape.ai/authorize` tabs remained open in the active Chrome session
- the GTM Editor OAuth flow completed in the `rajeev.sgill@gmail.com` profile and established a working MCP proxy
- GA realtime still showed live voting-app events on property `498363924`
- reporting dataset `personal-gws-1:hackathon_reporting` exists in `EU`
- reporting procedure `refresh_reporting_tables` exists
- transfer config `69d1795c-0000-21c1-bcb2-24058877ff20` is healthy and `SUCCEEDED`
- transfer run `69e03509-0000-2f53-ba6d-001a114b97f0` completed successfully
- Looker Studio shell report `e1b671cf-55b4-4c96-a4cd-ec1a0872e072` exists with BigQuery-backed scorecards and a time-series shell

Artifacts:

- `artifacts/analytics/looker-shell-ready.png`

Result:

- Pass

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
- The page no longer exposes redundant `Round control` or `Judging progress` panels; state is carried by compact chips and manager-only tracker surfaces instead

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

## Production analytics proof

Date: `2026-03-24`

Surface: `https://vote.rajeevg.com`

Commands:

```bash
curl -I https://vote.rajeevg.com
curl https://vote.rajeevg.com/metrics/healthy
set -a && source .env.vercel-prod && set +a && E2E_BASE_URL=https://vote.rajeevg.com pnpm exec playwright test tests/e2e/analytics-stack.spec.ts --reporter=list
```

Behavior proof:

- the live app rendered the analytics consent banner
- granting consent dismissed the banner and enabled analytics collection
- the app emitted analytics events into `window.dataLayer`
- the live page loaded the voting-app measurement ID `G-HT8Z6KR8CX`
- the browser sent first-party collection traffic to `/metrics/g/collect`
- the consent banner rendered in a reduced compact card instead of the earlier oversized overlay
- the floating privacy settings button was absent on mobile, with privacy controls still available in the footer
- desktop and mobile both passed the live consent-and-collection flow

Artifacts:

- `artifacts/playwright/analytics-stack-consent-en-035d7-r-routed-collection-traffic-desktop-light/analytics-before-consent.png`
- `artifacts/playwright/analytics-stack-consent-en-035d7-r-routed-collection-traffic-desktop-light/analytics-after-consent.png`
- `artifacts/playwright/analytics-stack-consent-en-035d7-r-routed-collection-traffic-mobile-dark/analytics-before-consent.png`
- `artifacts/playwright/analytics-stack-consent-en-035d7-r-routed-collection-traffic-mobile-dark/analytics-after-consent.png`

Supporting platform evidence:

- GA Admin API confirms web stream `14214480224` exists for `https://vote.rajeevg.com`
- GA Admin API confirms the BigQuery link is enabled and includes both the main site stream and the voting-app stream
- GA custom dimensions and metrics for the voting app were promoted on the shared property

Important note:

- the first production analytics proof failed because the Vercel measurement ID env var had been saved with a trailing newline
- that defect was fixed by removing and re-adding the env vars without the newline, then redeploying production and rerunning the proof

Result:

- Pass
