# Hackathon Voting App

Production-oriented single-screen hackathon voting app built with Next.js 14, TypeScript, Tailwind, Clerk, Prisma, and Postgres.

The app keeps the visual language of the original results dashboard, but the product has been simplified to one public scoreboard with an integrated manager control surface and a polished voting modal for judges.

The current layout is intentionally content-first: the scoreboard and next action are prioritized above the fold, while explanatory rules live in lighter supporting panels instead of dominating the first scan.
The screen stays single-column across viewports so the scoreboard leads and judging progress follows directly underneath it instead of competing in a side rail.

## What the app is now

- One primary public scoreboard at `/`
- Manager-only XLSX template download and XLSX upload
- Authenticated judge voting in a modal
- Automatic self-vote blocking from uploaded team-member emails
- Live judging progress
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
- single-column ordering with judging progress below the scoreboard

Cheap event-day readiness checks:

```bash
pnpm test tests/readiness.integration.test.ts
pnpm readiness:public -- --url https://vote.rajeevg.com --concurrency 50 --requests 250
```

These checks prove two different things:

- `tests/readiness.integration.test.ts` simulates 50 concurrent judges scoring a round in waves against the real Prisma-backed vote logic.
- `readiness:public` sends 250 public scoreboard requests with 50-way concurrency to confirm the live site stays responsive under the expected spectator load without requiring a paid load-testing service.

Proof notes live in [proof.md](/Users/rajeev/Code/hackathon-voting-prototype/docs/proof.md).

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
