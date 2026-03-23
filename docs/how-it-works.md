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
  - begin voting
  - finalize the round
  - export finalized scores

### Judge

- Any authenticated non-manager user is treated as a judge.
- Judges can sign in with Google or email code.
- Judges can score a project from `0` to `10`.
- Judges can edit their own score until the round is finalized.

## Auth

Auth is handled by Clerk.

- Production domain: `vote.rajeevg.com`
- Production Clerk frontend API domain: `clerk.vote.rajeevg.com`
- Google OAuth is enabled on production.
- Email-code auth is enabled as the fallback and works on production.

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
- Manager can download the template and upload/update the workbook.
- Voting controls stay locked.

### Open

- The manager clicks `Begin voting`.
- Authenticated judges can vote.
- Public viewers can keep watching the board update live.

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
- `Vote`: one active judge score per project, editable until finalization

See [/Users/rajeev/Code/hackathon-voting-prototype/prisma/schema.prisma](/Users/rajeev/Code/hackathon-voting-prototype/prisma/schema.prisma) for the exact schema and [/Users/rajeev/Code/hackathon-voting-prototype/docs/operating-model.md](/Users/rajeev/Code/hackathon-voting-prototype/docs/operating-model.md) for the rule details.

## Event-day operating checklist

1. Sign in as `rajeev.gill@omc.com`.
2. Download the template from `/`.
3. Fill one row per project and keep project names unique.
4. Upload the XLSX from the manager panel.
5. Confirm all entries appear on the scoreboard.
6. Click `Begin voting` once the judges are ready.
7. Ask judges to sign in once and vote from the modal.
8. Watch the progress card until completion reaches `100%`.
9. Click `Finalize`.
10. Export the finalized workbook.

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
