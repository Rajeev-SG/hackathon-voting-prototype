# Hackathon Voting App

Production-oriented single-screen hackathon voting app built with Next.js 14, TypeScript, Tailwind, Clerk, Prisma, and Postgres.

The app keeps the visual language of the original results dashboard, but the product has been simplified to one public scoreboard with an integrated manager control surface and a polished voting modal for judges.

The current layout is intentionally content-first: the scoreboard and next action are prioritized above the fold, while explanatory rules live in lighter supporting panels instead of dominating the first scan.
The screen stays single-column across viewports so the scoreboard leads the first scan, manager controls only appear for the manager, and round state is reduced to compact status chips instead of bulky side panels.
On mobile, the secondary scoreboard summary and board-view controls stay collapsed by default and expand as overlays, so the table itself remains visible sooner.

## What the app is now

- One primary public scoreboard at `/`
- Manager-only XLSX template download and XLSX upload
- Authenticated judge voting in a modal
- Automatic self-vote blocking from uploaded team-member emails
- Compact live status chips on the scoreboard
- Manager-only remaining-votes tracker that mirrors the real finalization denominator
- Table and horizontal bar-chart views on the same scoreboard
- Manager-only per-entry voting open/closed controls
- Manager-only finalization and finalized XLSX export
- Manager-only reset button for repeatable dry runs
- Light and dark mode
- Flows walkthrough mount via `flows.sh`

## Stack

- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS
- shadcn-style Radix primitives
- Clerk
- Prisma
- Postgres
- `xlsx`
- Playwright
- Vitest

## Source-of-truth files

- Main screen: [page.tsx](/Users/rajeev/Code/hackathon-voting-prototype/app/page.tsx)
- Dashboard shell: [results-dashboard.tsx](/Users/rajeev/Code/hackathon-voting-prototype/components/results-dashboard.tsx)
- Scoreboard table/cards: [results-scoreboard-table.tsx](/Users/rajeev/Code/hackathon-voting-prototype/components/results-scoreboard-table.tsx)
- Voting modal: [vote-dialog.tsx](/Users/rajeev/Code/hackathon-voting-prototype/components/vote-dialog.tsx)
- Competition rules: [competition-logic.ts](/Users/rajeev/Code/hackathon-voting-prototype/lib/competition-logic.ts)
- Workbook parsing/export: [xlsx.ts](/Users/rajeev/Code/hackathon-voting-prototype/lib/xlsx.ts)
- Prisma schema: [schema.prisma](/Users/rajeev/Code/hackathon-voting-prototype/prisma/schema.prisma)

## Environment

Copy [.env.example](/Users/rajeev/Code/hackathon-voting-prototype/.env.example) into `.env.local` and set:

```bash
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
DATABASE_URL=
POSTGRES_URL=
PRISMA_DATABASE_URL=
NEXT_PUBLIC_FLOWS_ORGANIZATION_ID=
NEXT_PUBLIC_FLOWS_ENVIRONMENT=production
```

Notes:

- `DATABASE_URL` is the runtime connection string Prisma uses in the app.
- `POSTGRES_URL` and `PRISMA_DATABASE_URL` are kept for Vercel/Postgres compatibility.
- Production Clerk is configured on `vote.rajeevg.com`.
- Google SSO is configured on the production Clerk instance.
- Local automated proof covers the email-code flow directly.
- Production automated proof uses Clerk sign-in tickets for deterministic runs, and live browser proof covers both Google sign-in and inbox-delivered email-code auth on `vote.rajeevg.com`.
- Clerk's paid "Custom email templates" feature is still required for deeper production email-template edits. The current live verification email is already branded as `Hackathon Voting App <notifications@vote.rajeevg.com>`, but template-level subject/body customization beyond that remains blocked on the current Clerk plan.

## Local run

Install with `pnpm`:

```bash
pnpm install
```

Generate Prisma client and apply local migrations if needed:

```bash
pnpm db:generate
pnpm db:migrate
```

Run the app:

```bash
pnpm dev
```

Open:

```text
http://localhost:3000
```

## Verified local commands

These commands were used on the shipped app:

```bash
pnpm test
pnpm build
pnpm check
pnpm test:e2e
```

Helpful utility commands:

```bash
pnpm proof:workbook
pnpm clerk:ticket -- --email rajeev.gill@omc.com --redirect /
```

## Manager workflow

The manager is exactly `rajeev.gill@omc.com`.

Only that account can:

- download the workbook template
- upload a workbook
- reset the round back to an empty state
- begin voting
- finalize the round
- export finalized results

## Completion rule

The app uses a practical judging-round rule:

- judges join the denominator when they cast their first vote
- self-vote-blocked projects are removed from that judge's denominator
- manager-closed projects are removed from the live denominator until reopened
- finalization unlocks when every participating judge has scored every project that is still open and eligible for them

Each judge can submit one score per project. Once submitted, that score is locked for the rest of the round.

More detail lives in [operating-model.md](/Users/rajeev/Code/hackathon-voting-prototype/docs/operating-model.md).

A fuller operational walkthrough lives in [how-it-works.md](/Users/rajeev/Code/hackathon-voting-prototype/docs/how-it-works.md).

## Proof commands

Local end-to-end proof:

```bash
pnpm test:e2e
```

Focused layout proof:

```bash
LAYOUT_PROOF=1 E2E_BASE_URL=https://vote.rajeevg.com pnpm exec playwright test tests/e2e/scoreboard-breakpoints.spec.ts --reporter=list
```

Production end-to-end proof:

```bash
E2E_BASE_URL=https://vote.rajeevg.com E2E_JUDGE_AUTH_MODE=ticket pnpm test:e2e
```

The Playwright suite covers:

- anonymous public viewing
- manager template download
- manager workbook upload
- manager per-entry open / close control
- manager remaining-votes tracker
- manager begin voting
- scoreboard table / bar-chart toggle
- email-code judge auth
- modal keyboard voting
- compact modal that fits above the fold on both proof viewports
- self-vote blocking
- single locked vote per judge per project
- progress completion
- finalization
- public finalized lock state
- manager XLSX export
- anonymous cross-device freshness after another judge casts a score
- single-column ordering with no redundant setup or progress panels

Cheap event-day readiness checks:

```bash
pnpm test tests/readiness.integration.test.ts
pnpm readiness:public -- --url https://vote.rajeevg.com --concurrency 50 --requests 250
```

These checks prove two different things:

- `tests/readiness.integration.test.ts` simulates 50 concurrent judges scoring a round in waves against the real Prisma-backed vote logic.
- `readiness:public` sends 250 public scoreboard requests with 50-way concurrency to confirm the live site stays responsive under the expected spectator load without requiring a paid load-testing service.

Proof notes live in [proof.md](/Users/rajeev/Code/hackathon-voting-prototype/docs/proof.md).
Viewport-specific appearance and usability findings live in [viewport-ux-audit.md](/Users/rajeev/Code/hackathon-voting-prototype/docs/viewport-ux-audit.md).
Analytics implementation notes live in [google-tagging-stack.md](/Users/rajeev/Code/hackathon-voting-prototype/docs/google-tagging-stack.md).
Analytics audit notes live in [analytics-audit.md](/Users/rajeev/Code/hackathon-voting-prototype/docs/analytics-audit.md).
Promoted GA dimension and metric definitions live in [google-tagging-stack.md](/Users/rajeev/Code/hackathon-voting-prototype/docs/google-tagging-stack.md#promoted-ga-custom-definitions).

## Analytics stack

Production analytics now includes:

- consent banner and privacy route
- app-owned `dataLayer` contract for scoreboard, upload, auth, and voting events
- direct Google tag delivery for the voting-app stream
- first-party server-side collection via `https://vote.rajeevg.com/metrics`
- GA4 custom dimensions and metrics for the hackathon app
- BigQuery export enabled for the voting-app stream
- a stable reporting dataset in BigQuery:
  - `personal-gws-1:hackathon_reporting`
- reporting tables ready for deeper analysis:
  - `daily_overview`
  - `auth_funnel_daily`
  - `voting_funnel_daily`
  - `entry_performance`
  - `manager_operations_daily`
  - `experience_overview_daily`
  - `event_breakdown`
  - `round_snapshots`
- a successful scheduled query refresh:
  - `projects/401448512581/locations/europe/transferConfigs/69d1795c-0000-21c1-bcb2-24058877ff20`
- most recent verified run:
  - `projects/401448512581/locations/europe/transferConfigs/69d1795c-0000-21c1-bcb2-24058877ff20/runs/69d4665f-0000-2933-a4f0-ac3eb1460e54`
- a live Looker Studio report shell with visible page scaffolds:
  - [Hackathon Voting Memory Dashboard](https://lookerstudio.google.com/reporting/e1b671cf-55b4-4c96-a4cd-ec1a0872e072/page/p_z5a814q31d/edit)
- report shell pages:
  - `Overview`
  - `Voting funnel`
  - `Entry analysis`
  - `Manager operations`
  - `Experience and devices`
  - `Event taxonomy`
- current audit status: the linked raw GA export dataset still has no landed `events_*` tables, but the reporting dataset, refresh pipeline, and six-page Looker shell are now visibly present and re-proven with direct page screenshots after correcting an earlier invalid blank/editor-state proof

Analytics env vars:

```bash
NEXT_PUBLIC_SITE_URL=https://vote.rajeevg.com
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-HT8Z6KR8CX
NEXT_PUBLIC_SERVER_CONTAINER_URL=https://vote.rajeevg.com/metrics
SGTM_UPSTREAM_ORIGIN=https://sgtm-live-6tmqixdp3a-nw.a.run.app
```

Analytics proof command:

```bash
E2E_BASE_URL=https://vote.rajeevg.com pnpm exec playwright test tests/e2e/analytics-stack.spec.ts --reporter=list
```

BigQuery reporting refresh:

```bash
bq query --location=EU --use_legacy_sql=false < sql/analytics/create_reporting_dataset.sql
bq query --location=EU --use_legacy_sql=false < sql/analytics/create_refresh_procedure.sql
bq query --location=EU --use_legacy_sql=false < sql/analytics/refresh_reporting_tables.sql
```

## Auth and deploy notes

- Vercel is the deployment target.
- Clerk is the auth provider.
- Postgres is the durable store.
- Production env vars must be present in Vercel before deploy.
- Production uses Clerk live keys on `vote.rajeevg.com`; development continues to use test keys locally.
- Google OAuth is configured for the production Clerk instance and production app domain.
- The live verification email already arrives branded from `Hackathon Voting App <notifications@vote.rajeevg.com>`.
- If a mobile judge switches to their email app to fetch the one-time code and then returns, the app restores the pending verification step instead of dropping them back on the email-entry form.
- Production verification-email template editing is still limited by the current Clerk plan; deeper subject/body customization requires a Clerk plan upgrade or a custom email-delivery integration.

## Production URL

- Live app: [vote.rajeevg.com](https://vote.rajeevg.com)
- Vercel production alias: [hackathon-voting-prototype.vercel.app](https://hackathon-voting-prototype.vercel.app)
