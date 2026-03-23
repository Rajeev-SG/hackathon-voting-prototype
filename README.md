# Hackathon Voting App

Production-oriented single-screen hackathon voting app built with Next.js 14, TypeScript, Tailwind, Clerk, Prisma, and Postgres.

The app keeps the visual language of the original results dashboard, but the product has been simplified to one public scoreboard with an integrated manager control surface and a polished voting modal for judges.

## What the app is now

- One primary public scoreboard at `/`
- Manager-only XLSX template download and XLSX upload
- Authenticated judge voting in a modal
- Automatic self-vote blocking from uploaded team-member emails
- Live judging progress
- Manager-only finalization and finalized XLSX export
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
- Google SSO should be enabled in Clerk when available.
- Email-code auth is the required fallback and is covered by automated proof.

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
- begin voting
- finalize the round
- export finalized results

## Completion rule

The app uses a practical judging-round rule:

- judges join the denominator when they cast their first vote
- self-vote-blocked projects are removed from that judge's denominator
- finalization unlocks when every participating judge has scored every project they are eligible to judge

More detail lives in [operating-model.md](/Users/rajeev/Code/hackathon-voting-prototype/docs/operating-model.md).

## Proof commands

Local end-to-end proof:

```bash
pnpm test:e2e
```

The Playwright suite covers:

- anonymous public viewing
- manager template download
- manager workbook upload
- manager begin voting
- email-code judge auth
- modal keyboard voting
- self-vote blocking
- single active vote with edits
- progress completion
- finalization
- public finalized lock state
- manager XLSX export

Proof notes live in [proof.md](/Users/rajeev/Code/hackathon-voting-prototype/docs/proof.md).

## Auth and deploy notes

- Vercel is the deployment target.
- Clerk is the auth provider.
- Postgres is the durable store.
- Production env vars must be present in Vercel before deploy.
- If Google OAuth cannot be fully completed from the dashboard without a manual external consent step, the app should still ship with Clerk email-code auth working.

## Production URL

- Live app: [hackathon-voting-prototype.vercel.app](https://hackathon-voting-prototype.vercel.app)
