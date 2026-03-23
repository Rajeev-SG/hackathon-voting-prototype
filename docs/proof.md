# Proof

## Local proof

Date: `2026-03-23`

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
- Manager uploads a workbook and seeded entries appear
- Manager begins voting
- Judge signs in with email-code auth
- Vote modal supports keyboard selection and submission
- Judge edits an existing vote without creating a duplicate active vote
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

## Production proof

Date: `2026-03-23`

Surface: `https://hackathon-voting-prototype.vercel.app`

Command:

```bash
E2E_BASE_URL=https://hackathon-voting-prototype.vercel.app pnpm test:e2e
```

Viewports exercised:

- `desktop-light`
- `mobile-dark`

Behavior proof:

- Public scoreboard is reachable without auth
- Manager template download, workbook upload, begin-voting, finalization, and export all complete successfully
- Email-code judge auth works on the deployed app
- The vote modal opens from the scoreboard, accepts keyboard score selection, submits successfully, and supports score edits
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
