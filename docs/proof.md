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
- Manager begins voting
- Judge signs in with email-code auth
- The mobile email-code auth flow survives a page remount and returns to the verification step instead of resetting to email entry
- Vote modal supports keyboard selection and submission
- Judge is locked out from changing a project after submitting the first vote
- Self-voting is blocked for matching team emails
- Progress reaches completion under the documented denominator rule
- Manager finalizes the round
- Manager downloads the finalized XLSX export
- Public finalized state is visible and modal voting is locked

Artifacts:

- Playwright report directory: `artifacts/playwright-report`
- Playwright screenshots and traces: `artifacts/playwright/`

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
- Manager template download, workbook upload, begin-voting, finalization, and export all complete successfully
- The vote modal opens from the scoreboard, accepts keyboard score selection, submits successfully, and then locks the judge out from changing that project
- Self-vote blocking is enforced from uploaded team emails
- Finalized public state locks the modal and keeps the scoreboard readable

Design proof notes:

- Desktop uses the full width well without horizontal overflow
- Mobile layout preserves the single-screen journey and keeps the modal legible and tappable
- The modal remains the visual center of the flow on both viewports

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
