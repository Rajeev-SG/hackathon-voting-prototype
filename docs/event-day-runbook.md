# Event-Day Risk Runbook

Date: `2026-03-24`

Purpose:

- give the manager a practical, low-stress operating guide for the hackathon judging day
- list the risks most likely to affect smooth operation
- show how to detect, prevent, and recover from those risks quickly

This is the operational companion to:

- [/Users/rajeev/Code/hackathon-voting-prototype/docs/operating-model.md](/Users/rajeev/Code/hackathon-voting-prototype/docs/operating-model.md)
- [/Users/rajeev/Code/hackathon-voting-prototype/docs/proof.md](/Users/rajeev/Code/hackathon-voting-prototype/docs/proof.md)

## Executive summary

Current readiness verdict:

- Pass for a room-sized event if the manager follows the preflight and recovery steps below.

What this app is currently strongest at:

- public scoreboard reads under spectator-style traffic
- one-screen manager workflow for upload, begin voting, per-entry control, finalize, and export
- judge voting with Google and email-code auth
- self-vote blocking from workbook team emails
- mobile scoreboard disclosures and cross-device score freshness

What still needs human discipline on the day:

- start from a clean round
- avoid unnecessary resets once judging is underway
- use the remaining-votes tracker before finalizing
- fall back to email-code auth if Google SSO is having a bad moment

## Verified readiness evidence

Fresh evidence from this pass:

- `set -a && source .env.vercel-prod && set +a && pnpm readiness:db -- --url https://vote.rajeevg.com`
- `pnpm exec vitest run tests/votes.integration.test.ts tests/readiness.integration.test.ts --reporter=verbose`
- `pnpm readiness:public -- --url https://vote.rajeevg.com --concurrency 50 --requests 500`
- `set -a && source .env.vercel-prod && set +a && pnpm readiness:smoke -- --base-url https://vote.rajeevg.com`
- `LAYOUT_PROOF=1 E2E_BASE_URL=https://vote.rajeevg.com pnpm exec playwright test tests/e2e/scoreboard-breakpoints.spec.ts --reporter=list`

Current live public-read result:

- `500/500` requests completed
- `0` failures
- `p50 175.65ms`
- `p95 1819.43ms`
- `p99 1982.92ms`
- `max 2128.46ms`

Current live smoke result:

- manager signed in
- manager reset an already-live round to a clean start
- manager uploaded a workbook
- manager opened voting
- judge signed in and cast a real score
- manager tracker updated
- public board reflected the vote

Smoke artifacts:

- [/Users/rajeev/Code/hackathon-voting-prototype/artifacts/event-day-smoke/2026-03-24T20-01-32.881Z/event-day-smoke-public.png](/Users/rajeev/Code/hackathon-voting-prototype/artifacts/event-day-smoke/2026-03-24T20-01-32.881Z/event-day-smoke-public.png)
- [/Users/rajeev/Code/hackathon-voting-prototype/artifacts/event-day-smoke/2026-03-24T20-01-32.881Z/summary.json](/Users/rajeev/Code/hackathon-voting-prototype/artifacts/event-day-smoke/2026-03-24T20-01-32.881Z/summary.json)

## Preflight checklist

Run this once around 30 to 60 minutes before judges arrive.

1. Confirm the live site is reachable.

```bash
curl -I https://vote.rajeevg.com
```

Expected:

- `HTTP/2 200`

2. Run the non-destructive database and vendor preflight.

```bash
set -a && source .env.vercel-prod && set +a
pnpm readiness:db -- --url https://vote.rajeevg.com
```

Expected:

- public site check returns `200` and a scoreboard signal
- `neon-hotfix` is `Available`
- `HOTFIX_DATABASE_URL` and `HOTFIX_DATABASE_URL_UNPOOLED` are present in production
- the direct database query succeeds when `.env.vercel-prod` is loaded
- a suspended legacy Prisma resource is not itself a blocker as long as the hotfix Neon resource is green

3. Confirm the public board still handles expected spectator load.

```bash
pnpm readiness:public -- --url https://vote.rajeevg.com --concurrency 50 --requests 500
```

Expected:

- `failures: 0`
- all statuses `200`

4. Run the production smoke path.

```bash
set -a && source .env.vercel-prod && set +a
pnpm readiness:smoke -- --base-url https://vote.rajeevg.com
```

Expected:

- script exits `0`
- `result: "pass"`

5. Sign into the live app as the manager and visually confirm:

- the workbook you intend to use is ready
- the board is either intentionally empty or intentionally loaded
- the manager tracker is visible once voting is open
- the footer privacy controls are present

## Five-minute checklist

Run this right before judges begin.

1. Sign in as `rajeev.gill@omc.com`.
2. If the board contains stale rehearsal data, click `Reset dry run`.
3. Upload the final workbook.
4. Scan the scoreboard for obvious row or email mistakes.
5. Click `Begin voting`.
6. Keep the manager screen open during judging.
7. Use the remaining-votes tracker before finalizing.

## Risk register

### 1. Dirty round state at the start of the event

Symptom:

- the board already shows entries or `Voting live` before the real round has started

Cause:

- a rehearsal or proof run left state behind

Prevention:

- run the smoke command before judges arrive

Recovery:

1. Sign in as the manager.
2. Click `Reset dry run`.
3. Re-upload the final workbook.
4. Confirm the board contents are correct before reopening voting.

Severity:

- High

### 2. First votes fail right after the manager opens the round

Symptom:

- a judge sees `Voting is not currently open.` immediately after the manager just opened voting

Cause:

- transient read-after-write lag right after opening the round or replacing entries

Prevention:

- avoid asking judges to vote in the same instant that the manager clicks `Begin voting`
- give the board a few seconds to settle after upload or round-open

Recovery:

1. Ask the judge to refresh the page once.
2. If needed, wait 3 to 5 seconds and reopen the modal.
3. If multiple judges report it at once, pause for 10 seconds, then retry.

Notes:

- the vote path now retries this transition internally before failing

Severity:

- Medium

### 3. Accidental reset while the round is active

Symptom:

- the board suddenly empties and votes disappear

Cause:

- manager intentionally or accidentally clicked `Reset dry run`

Prevention:

- do not use reset during the live round unless recovery is impossible any other way
- keep one manager laptop dedicated to the operations view

Recovery:

1. Re-upload the workbook immediately.
2. Reopen voting.
3. Tell judges to refresh and continue.
4. If the reset happened late in judging, use the exported workbook from the last finalized rehearsal only as a reference, not as a data restore.

Important limitation:

- reset is destructive; it is a salvage tool, not a normal live-round control

Severity:

- High

### 4. Google sign-in is flaky for a judge

Symptom:

- judge cannot complete Google auth

Cause:

- Google SSO popup or vendor-side auth issue

Prevention:

- remind judges that email-code auth is fully supported

Recovery:

1. Open the judge sign-in modal.
2. Enter the judge email.
3. Use email-code auth instead of Google.
4. Return to the app and continue voting.

Severity:

- Medium

### 5. Mobile users say the board controls are broken

Symptom:

- users cannot find details or chart controls on mobile

Cause:

- the controls are now collapsed by design to keep the board higher above the fold

Prevention:

- mention that `Details` and `Board view` are tap-to-open sheets on mobile

Recovery:

1. Tap `Details` for board summary chips.
2. Tap `Board view` to switch between table and bar chart.
3. Close either sheet and continue using the board.

Severity:

- Low

### 6. A judge cannot vote on a project

Symptom:

- modal says voting is paused, finalized, or self-voting is blocked

Cause:

- manager closed that project
- the round is finalized
- the judge email matches an uploaded team email

Recovery:

- `Voting is paused`
  - manager reopens that project from the row toggle
- `Judging is finalized`
  - no recovery; results are locked
- `Self-voting is blocked`
  - expected behavior; judge must score other eligible entries

Severity:

- Medium

### 7. Finalize button does not appear or remains disabled

Symptom:

- manager cannot finalize even though judging feels nearly done

Cause:

- one or more participating judges still owe votes on open, eligible projects

Recovery:

1. Check the remaining-votes tracker.
2. Read the outstanding judge emails and project list directly from that tracker.
3. Either:
   - get those judges to finish their remaining votes
   - or intentionally close specific projects if they should no longer count toward completion

Severity:

- Medium

### 8. Workbook upload fails

Symptom:

- upload returns row validation errors

Cause:

- missing project name
- no team email on a row
- duplicate project names
- malformed email content

Recovery:

1. Read the row-level validation message in the manager panel.
2. Fix the workbook locally.
3. Upload again.

Fallback:

- keep the prior loaded workbook live until the corrected one is ready

Severity:

- Medium

### 9. Public board appears slow or stale

Symptom:

- score changes do not appear immediately for spectators

Cause:

- short public cache window
- focused-tab refresh rules
- temporary network lag

Recovery:

1. Wait a few seconds.
2. Switch tabs or refocus the browser.
3. Manually refresh if needed.

Notes:

- the board auto-refreshes while judging is open
- the public read cache is intentionally short-lived

Severity:

- Low

### 10. Vercel or database degradation

Symptom:

- multiple judges cannot load or save anything
- `curl -I https://vote.rajeevg.com` stops returning `200`
- public load probe starts showing failures

Recovery:

1. Re-run:

```bash
curl -I https://vote.rajeevg.com
pnpm readiness:public -- --url https://vote.rajeevg.com --concurrency 20 --requests 100
```

2. If failures persist:
   - stop asking judges to cast new votes for a moment
   - keep the manager screen open
   - do not reset the round unless absolutely necessary
3. Use Vercel to inspect the current production deployment and logs:

```bash
vercel inspect vote.rajeevg.com
vercel logs vote.rajeevg.com
```

Severity:

- High

## Recovery patterns by symptom

### “We need a clean start”

Use:

- manager `Reset dry run`

Then:

- upload workbook
- confirm rows
- begin voting

### “A judge is stuck signing in”

Use:

- email-code auth fallback

### “A project should not count right now”

Use:

- manager per-entry `close to new votes` toggle

### “Why can’t we finalize?”

Use:

- manager remaining-votes tracker

### “The public board feels odd or slow”

Use:

- `curl`
- `pnpm readiness:public`
- manual refresh/focus return

## Recommended on-day command pack

```bash
curl -I https://vote.rajeevg.com
pnpm readiness:public -- --url https://vote.rajeevg.com --concurrency 50 --requests 500
set -a && source .env.vercel-prod && set +a
pnpm readiness:smoke -- --base-url https://vote.rajeevg.com
```

## Final operating advice

- Keep one manager laptop signed in for the whole event.
- Do not use reset casually once real votes have started.
- Prefer reopening or closing individual projects over destructive round resets.
- Use the remaining-votes tracker as the source of truth before finalizing.
- If Google auth wobbles, move judges to email-code auth immediately instead of waiting for vendor behavior to recover.
