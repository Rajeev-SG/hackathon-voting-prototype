# How The Hackathon Voting App Works

## Product shape

The app is intentionally a single-screen product.

- Public users land on `/` and can always see the live scoreboard.
- The manager uses the same screen to download the XLSX template, upload entries, begin voting, finalize results, and export the final workbook.
- Judges use the same screen to sign in and vote from the modal.
- Legacy routes such as `/projects`, `/results`, and `/submission/assets` redirect back to `/`.

## Roles

### Public viewer

- No auth required.
- Can see the scoreboard, judging progress, and finalized state.
- Cannot upload, begin voting, finalize, or vote.

### Manager

- The manager is exactly `rajeev.gill@omc.com`.
- Only this user can:
  - download the workbook template
  - upload a workbook
  - reset the round to an empty workbook-driven state
  - begin voting
  - finalize the round
  - export finalized scores

### Judge

- Any authenticated non-manager user is treated as a judge.
- Judges can sign in with Google or email code.
- Judges can score a project from `0` to `10`.
- Judges get one score per project. Once submitted, that score is locked for the rest of the round.

## Auth

Auth is handled by Clerk.

- Production domain: `vote.rajeevg.com`
- Production Clerk frontend API domain: `clerk.vote.rajeevg.com`
- Google OAuth is enabled on production.
- Email-code auth is enabled as the fallback and works on production.
- If a judge requests an email code on mobile, switches to their email app, and returns, the app restores the pending verification step so they can enter the code immediately instead of restarting from the email form.

Live email behavior on production:

- Sender: `Hackathon Voting App <notifications@vote.rajeevg.com>`
- The email body clearly presents the verification code and identifies the app.

Current known vendor limitation:

- Clerk production custom email-template editing is still plan-gated.
- The current branded sender/domain is working well enough for the event, but deeper subject/body customization would require a higher Clerk plan or custom delivery.

## Workbook format

Managers upload a simple XLSX workbook.

Supported template columns:

- `Project Name`
- `Team Name`
- `Summary`
- `Team Member 1 Email`
- `Team Member 2 Email`
- `Team Member 3 Email`
- `Team Member 4 Email`
- `Optional Note`

Important rules:

- The downloaded template is intentionally blank. There are no seeded demo or placeholder projects.
- `Project Name` must be unique.
- Each row must contain at least one team email.
- Unknown non-email columns are tolerated and stored as metadata.
- Legacy fields such as tracks, booths, demo URLs, repository URLs, and image URLs are no longer part of the product.

## Self-vote blocking

Every uploaded team-member email is stored against that project.

- When a judge opens the vote modal, the app compares the authenticated email to the uploaded team emails.
- If the emails match, the project is locked for that judge.
- The UI explains the lock state clearly instead of failing silently.

## Voting lifecycle

### Preparing

- Public scoreboard is visible.
- Manager can download the blank template and upload or replace the workbook.
- Voting controls stay locked.

### Resetting for another dry run

- The manager can click `Reset dry run` from the same screen.
- Reset clears uploaded entries, stored team emails, votes, and the current judging lifecycle state.
- After reset, the board returns to an intentionally empty state until a new workbook is uploaded.

### Open

- The manager clicks `Begin voting`.
- Authenticated judges can vote.
- Public viewers can keep watching the board update live.
- Active tabs refresh automatically every 5 seconds during judging, and inactive tabs refresh again when they regain focus.

### Finalized

- The manager can finalize only when the round is complete.
- Finalization locks further edits.
- The public scoreboard switches to finalized state.
- The manager can export the finalized workbook.

## Progress and completion rule

The progress model is intentionally practical for hackathon use.

- A judge joins the denominator when they cast their first vote.
- Projects a judge is self-vote-blocked from are removed from that judge's denominator.
- Completion means every participating judge has scored every project they are eligible to judge.

This keeps the progress bar coherent without introducing heavy judge-roster administration.

## Data model

The production data model is intentionally small.

- `CompetitionState`: manager identity, lifecycle state, started/finalized timestamps
- `Entry`: uploaded project row and aggregate project metadata
- `EntryTeamEmail`: normalized team emails used for self-vote blocking
- `Vote`: one locked judge score per project for the active round

See [/Users/rajeev/Code/hackathon-voting-prototype/prisma/schema.prisma](/Users/rajeev/Code/hackathon-voting-prototype/prisma/schema.prisma) for the exact schema and [/Users/rajeev/Code/hackathon-voting-prototype/docs/operating-model.md](/Users/rajeev/Code/hackathon-voting-prototype/docs/operating-model.md) for the rule details.

## Event-day operating checklist

1. Sign in as `rajeev.gill@omc.com`.
2. Download the template from `/`.
3. Fill one row per project and keep project names unique.
4. Upload the XLSX from the manager panel.
5. Confirm all entries appear on the scoreboard and that there is no placeholder content.
6. If you need a clean rehearsal, click `Reset dry run`, then upload again.
7. Click `Begin voting` once the judges are ready.
8. Ask judges to sign in once and vote from the modal.
9. Watch the progress card until completion reaches `100%`.
10. Click `Finalize`.
11. Export the finalized workbook.

## Proof and verification

Local validation:

```bash
pnpm test
pnpm check
pnpm build
pnpm test:e2e
```

Production validation:

```bash
E2E_BASE_URL=https://vote.rajeevg.com E2E_JUDGE_AUTH_MODE=ticket pnpm test:e2e
```

Event-day readiness validation:

```bash
pnpm test tests/readiness.integration.test.ts
pnpm readiness:public -- --url https://vote.rajeevg.com --concurrency 50 --requests 250
```

What that readiness pack means in practice:

- The write path has been exercised with 50 concurrent judges across a full round.
- The public scoreboard has been probed at 50-way concurrency without paying for an external load platform.
- Cross-device freshness is covered by browser proof, where an anonymous viewer sees a judge's updated score without manually reloading.

Manual production proof also matters for auth:

- Google sign-in was verified live in the browser.
- Email-code delivery was verified live in Gmail and the received code successfully signed back into the app.

## Authoritative references

- Main screen: [/Users/rajeev/Code/hackathon-voting-prototype/app/page.tsx](/Users/rajeev/Code/hackathon-voting-prototype/app/page.tsx)
- Dashboard shell: [/Users/rajeev/Code/hackathon-voting-prototype/components/results-dashboard.tsx](/Users/rajeev/Code/hackathon-voting-prototype/components/results-dashboard.tsx)
- Scoreboard: [/Users/rajeev/Code/hackathon-voting-prototype/components/results-scoreboard-table.tsx](/Users/rajeev/Code/hackathon-voting-prototype/components/results-scoreboard-table.tsx)
- Vote modal: [/Users/rajeev/Code/hackathon-voting-prototype/components/vote-dialog.tsx](/Users/rajeev/Code/hackathon-voting-prototype/components/vote-dialog.tsx)
- Workbook parser/export: [/Users/rajeev/Code/hackathon-voting-prototype/lib/xlsx.ts](/Users/rajeev/Code/hackathon-voting-prototype/lib/xlsx.ts)
- Rules: [/Users/rajeev/Code/hackathon-voting-prototype/lib/competition-logic.ts](/Users/rajeev/Code/hackathon-voting-prototype/lib/competition-logic.ts)
- Proof notes: [/Users/rajeev/Code/hackathon-voting-prototype/docs/proof.md](/Users/rajeev/Code/hackathon-voting-prototype/docs/proof.md)
