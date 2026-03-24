# Operating Model

## Product shape

The app is intentionally a single-screen hackathon voting surface.

- `/` is the only primary route.
- The public scoreboard is always visible without authentication.
- Manager controls are embedded into the same screen instead of living on a separate admin route.
- Legacy prototype routes are still present only as compatibility redirects or de-emphasized shells.

## Roles

### Public viewer

- Can open the scoreboard without signing in.
- Can inspect entries and aggregate score movement.
- Cannot upload, vote, finalize, or export.

### Judge

- Any authenticated non-manager user is treated as a judge once voting has begun.
- Judges sign in with Clerk.
- The preferred auth path is Google SSO when enabled in Clerk.
- The required fallback path is email code auth, which is fully wired and covered by proof.
- Judges can cast one active score per project from `0` to `10`.
- Judges can submit exactly one score per project.
- Once submitted, that score is locked for the rest of the round.

### Manager

- The manager identity is hard-coded as `rajeev.gill@omc.com`.
- Only the manager can download the template, upload the workbook, begin voting, finalize, and export finalized results.

## Data model

Prisma models live in [schema.prisma](/Users/rajeev/Code/hackathon-voting-prototype/prisma/schema.prisma).

### `CompetitionState`

- Singleton row keyed as `id = 1`
- Stores the active lifecycle state:
  - `PREPARING`
  - `OPEN`
  - `FINALIZED`
- Stores `startedAt`, `finalizedAt`, and the configured manager email

### `Entry`

- One row per uploaded project
- Stores the scoreboard-facing fields:
  - project name
  - slug
  - team name
  - summary
  - metadata JSON for tolerated extra workbook columns
  - per-entry `isVotingOpen` state for manager row controls

### `EntryTeamEmail`

- Normalized team-member emails attached to each entry
- Used to enforce self-vote blocking automatically

### `Vote`

- One active row per `entryId + judgeEmail`
- Re-submitting a score is rejected; each judge gets one locked score per project for the round

## Workbook contract

Template generation and parsing live in [xlsx.ts](/Users/rajeev/Code/hackathon-voting-prototype/lib/xlsx.ts).

### Supported columns

The generated template includes:

- `Project Name`
- `Team Name`
- `Summary`
- `Team Member 1 Email`
- `Team Member 2 Email`
- `Team Member 3 Email`
- `Team Member 4 Email`
- `Optional Note`

### Parsing rules

- The parser accepts the template sheet or the first sheet in the workbook.
- Empty rows are ignored.
- `Project Name` is required and must be unique.
- At least one team-member email is required per row.
- Email columns are discovered by header name containing `email`.
- Unknown non-email columns are preserved into metadata JSON.
- Invalid rows are rejected with row-specific validation errors that are surfaced in the manager UI.

## Self-vote blocking

Self-vote blocking is derived from normalized email equality between the signed-in judge and any stored team email on the entry.

- If a judge email matches an uploaded team email for a project, voting is blocked for that project.
- The rule is enforced both in the UI and in the vote API.
- The modal explains the rule directly so the manager does not need to manually police it.

## Voting lifecycle

### `PREPARING`

- Public scoreboard is visible.
- Manager can download the template and upload a workbook.
- Manager can close or reopen individual projects before the round starts.
- Voting actions open the modal but remain locked.

### `OPEN`

- Public scoreboard stays visible.
- Authenticated judges can vote.
- The manager can close or reopen individual projects without removing them from the public board.
- The manager sees a remaining-votes tracker that lists only participating judges, the open projects they still owe, and the total votes still outstanding.
- A judge becomes part of the progress denominator the moment they cast their first score.
- Each judge can submit exactly one score per project for the active round.
- After submission, that project is locked for that judge unless the manager resets the whole round.
- Active scoreboard tabs auto-refresh every 5 seconds during judging, and focused tabs also refresh on visibility or focus return.

### `FINALIZED`

- Voting is locked for everyone.
- The public scoreboard is final.
- The manager can export finalized results as XLSX.

## Completion and finalization rule

Progress logic lives in [competition-logic.ts](/Users/rajeev/Code/hackathon-voting-prototype/lib/competition-logic.ts).

Completion is intentionally simple and operationally practical:

- A judge joins the round once they cast their first score.
- For each participating judge, the app computes which entries they are eligible to score.
- Entries blocked by self-vote rules are removed from that judge's denominator.
- Entries the manager has closed to new votes are removed from the live denominator until reopened.
- The round is complete when every participating judge has scored every project that is still open and eligible for them.
- Finalization is available only when the round is `OPEN` and that completion rule is satisfied.
- The manager tracker reuses the same eligibility logic so the outstanding list is trustworthy enough to use operationally during the event.

This keeps the rule coherent without introducing a separate roster-management system.

## Auth assumptions

- Clerk is the auth provider.
- Google SSO should be enabled in the Clerk dashboard when available.
- Email-code auth is the required fallback and the currently proven path.
- Session persistence is handled by Clerk and survives browser restarts in normal usage.
- The manager role is not stored separately in the database; it is derived from the authenticated primary email address.

## UI notes

- The design system preserves the existing dark teal / glass / results-dashboard visual language.
- Light mode is supported and intentionally styled instead of falling back to generic defaults.
- The main screen is intentionally one column on every viewport so the scoreboard owns the page and progress sits below it.
- The scoreboard can switch between a ranked table and a horizontal bar chart.
- The vote modal is the emotional center of the product and is designed to:
  - keep project context visible
  - support keyboard-first scoring
  - announce feedback with live regions
  - stay fully above the fold in the proven desktop and mobile judge flows
  - remain usable on mobile

## Event-day readiness notes

- The production readiness target is a room-sized session of roughly 50 judges or viewers at once, not a viral public launch.
- Signed-out scoreboard requests use a short server cache with explicit invalidation on voting lifecycle changes, which reduces repeated public read pressure on the database while keeping the board fresh.
- The repo includes a cheap public-read probe at `pnpm readiness:public` so the live site can be checked before the event without extra vendor spend.
- Concurrent write readiness is covered in `tests/readiness.integration.test.ts`, which runs the real vote logic with 50 concurrent judges in project-by-project waves.
