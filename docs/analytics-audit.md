# Analytics Audit

Date: `2026-03-24`

## Scope

This audit covers the production analytics implementation for `https://vote.rajeevg.com`.

The target setup included:

- consent-aware analytics
- privacy-policy coverage
- a structured voting-app-owned `dataLayer`
- production collection through a first-party server endpoint
- GA4 stream and custom-definition setup
- BigQuery export setup
- browser proof on production with real evidence

## Verdict

### Collection and consent

- Pass

### GA4 property and stream setup

- Pass

### BigQuery export configuration

- Pass

### Looker Studio presentation artifact

- Pass

The production collection stack is live and evidenced. The remaining caveat is that Google has not yet materialized raw `events_*` export tables in the linked GA export dataset during this audit window. To remove that dependency from the reporting shell, the stack now includes a separate `hackathon_reporting` dataset, a stored procedure, and a successful scheduled-query refresh config that keeps the Looker shell ready as soon as raw export tables begin landing.

## What was verified with live evidence

### Browser proof on production

Surface:

- `https://vote.rajeevg.com`

Command:

```bash
set -a && source .env.vercel-prod && set +a && E2E_BASE_URL=https://vote.rajeevg.com pnpm exec playwright test tests/e2e/analytics-stack.spec.ts --reporter=list
```

Observed result:

- consent banner rendered
- granting analytics consent dismissed the banner
- desktop consent UI rendered as a compact card rather than the earlier oversized banner
- mobile removed the floating privacy button and kept privacy controls in the footer
- the page emitted app-owned `dataLayer` events including:
  - `page_context`
  - `consent_state_updated`
  - `judge_auth_dialog_opened`
- the live page loaded the voting-app measurement ID:
  - `https://www.googletagmanager.com/gtag/js?id=G-HT8Z6KR8CX`
- the browser sent production hits through the first-party server path:
  - `https://vote.rajeevg.com/metrics/g/collect?...tid=G-HT8Z6KR8CX...`

Artifacts:

- [/Users/rajeev/Code/hackathon-voting-prototype/artifacts/playwright/analytics-stack-consent-en-035d7-r-routed-collection-traffic-desktop-light/analytics-before-consent.png](/Users/rajeev/Code/hackathon-voting-prototype/artifacts/playwright/analytics-stack-consent-en-035d7-r-routed-collection-traffic-desktop-light/analytics-before-consent.png)
- [/Users/rajeev/Code/hackathon-voting-prototype/artifacts/playwright/analytics-stack-consent-en-035d7-r-routed-collection-traffic-desktop-light/analytics-after-consent.png](/Users/rajeev/Code/hackathon-voting-prototype/artifacts/playwright/analytics-stack-consent-en-035d7-r-routed-collection-traffic-desktop-light/analytics-after-consent.png)
- [/Users/rajeev/Code/hackathon-voting-prototype/artifacts/playwright/analytics-stack-consent-en-035d7-r-routed-collection-traffic-mobile-dark/analytics-before-consent.png](/Users/rajeev/Code/hackathon-voting-prototype/artifacts/playwright/analytics-stack-consent-en-035d7-r-routed-collection-traffic-mobile-dark/analytics-before-consent.png)
- [/Users/rajeev/Code/hackathon-voting-prototype/artifacts/playwright/analytics-stack-consent-en-035d7-r-routed-collection-traffic-mobile-dark/analytics-after-consent.png](/Users/rajeev/Code/hackathon-voting-prototype/artifacts/playwright/analytics-stack-consent-en-035d7-r-routed-collection-traffic-mobile-dark/analytics-after-consent.png)

### Live health checks

Commands:

```bash
curl -I https://vote.rajeevg.com
curl https://vote.rajeevg.com/metrics/healthy
```

Observed result:

- app returned `HTTP/2 200`
- server-container health route returned `ok`

### GA4 Admin configuration

Verified by live API calls against the property:

- voting-app web stream exists
  - `properties/498363924/dataStreams/14214480224`
  - measurement ID `G-HT8Z6KR8CX`
  - default URI `https://vote.rajeevg.com`
- BigQuery link exists and is enabled
  - `properties/498363924/bigQueryLinks/QW0m3ZzhTl2jFYPJO2MIzA`
  - `daily_export_enabled = true`
  - `streaming_export_enabled = true`
  - export streams include:
    - `properties/498363924/dataStreams/11542983613`
    - `properties/498363924/dataStreams/14214480224`
- hackathon custom dimensions were created
- hackathon custom metrics were created

Definition coverage:

- the operator-facing definitions for every promoted dimension and metric now live in [/Users/rajeev/Code/hackathon-voting-prototype/docs/google-tagging-stack.md](/Users/rajeev/Code/hackathon-voting-prototype/docs/google-tagging-stack.md)
- each definition explains the plain-English meaning, expected values or units, and how it should be interpreted in reporting

### GA realtime confirmation

Realtime API evidence currently shows fresh standard events on the property:

- `session_start`
- `page_view`
- `user_engagement`

Important nuance:

- the browser proof is the stronger attribution source for the voting app right now, because the request URLs explicitly contain `tid=G-HT8Z6KR8CX` and the first-party `/metrics/g/collect` path
- GA realtime custom-event visibility can lag slightly behind live collection

### BigQuery landing state

Verified:

- dataset `personal-gws-1:ga4_498363924` exists
- export link is attached to the voting-app stream
- streaming and daily export are enabled
- `bq show --format=prettyjson personal-gws-1:ga4_498363924` returns the linked EU dataset owned by `rajeev.sgill@gmail.com`
- reporting dataset `personal-gws-1:hackathon_reporting` exists in `EU`
- reporting tables exist:
  - `daily_overview`
  - `event_breakdown`
  - `entry_performance`
  - `round_snapshots`
- stored procedure exists:
  - ``personal-gws-1.hackathon_reporting.refresh_reporting_tables``
- scheduled query transfer exists and is now healthy:
  - `projects/401448512581/locations/europe/transferConfigs/69d1795c-0000-21c1-bcb2-24058877ff20`
  - display name `Hackathon reporting rollup`
  - owner `rajeev.sgill@gmail.com`
  - state `SUCCEEDED`
- a forced transfer run completed successfully:
  - `projects/401448512581/locations/europe/transferConfigs/69d1795c-0000-21c1-bcb2-24058877ff20/runs/69e03509-0000-2f53-ba6d-001a114b97f0`
- transfer log confirms:
  - `Job scheduled_query_69e03509-0000-2f53-ba6d-001a114b97f0 (table ) completed successfully.`

Not yet verified in this same pass:

- landed `events_intraday_*` or `events_*` rows attributable to the new voting stream
- `bq ls -a -n 20 personal-gws-1:ga4_498363924` currently returns no tables

This is an expected latency-sensitive area inside Google’s export pipeline. The reporting shell is no longer blocked on that latency because the refresh procedure and scheduled query are already in place and proven.

### GTM MCP state

Verified:

- `gtm_mcp` is enabled in Codex config and aligned across the mirrored agent configs
- the authoritative endpoint is now `https://mcp.gtmeditor.com`
- `codex mcp list` confirms the live command:
  - `npx -y mcp-remote https://mcp.gtmeditor.com`
- the alternative GTM Editor endpoint completed OAuth in the correct Chrome profile and established a live proxy:
  - `Connected to remote server using StreamableHTTPClientTransport`
  - `Proxy established successfully`
- no lingering `gtm-mcp.stape.ai/authorize` tabs remain open in the current Chrome session

Conclusion:

- the Stape OAuth tab-spam problem was removed from the active setup
- GTM MCP is now routed through the verified GTM Editor endpoint instead of the Stape endpoint

### Looker Studio reporting shell

Verified:

- a dedicated hackathon Looker Studio report shell now exists
- report title:
  - `Hackathon Voting Memory Dashboard`
- report edit URL:
  - `https://lookerstudio.google.com/reporting/e1b671cf-55b4-4c96-a4cd-ec1a0872e072/page/bc8sF/edit`
- the shell is connected to the BigQuery reporting dataset via `daily_overview`
- the shell already contains:
  - scoreboard-level scorecards
  - a time-series chart scaffold
  - a live BigQuery-backed report surface that will populate when reporting rows arrive
- screenshot evidence:
  - [/Users/rajeev/Code/hackathon-voting-prototype/artifacts/analytics/looker-shell-ready.png](/Users/rajeev/Code/hackathon-voting-prototype/artifacts/analytics/looker-shell-ready.png)

## Problems found during implementation

### Production env newline bug

The first production proof caught a real defect:

- the Vercel measurement ID had been saved with a trailing newline
- the live page requested:
  - `https://www.googletagmanager.com/gtag/js?id=G-HT8Z6KR8CX%0A`
- result:
  - the production browser proof failed because no valid collection requests were observed

Fix:

- removed and re-added the affected Vercel env vars without trailing newlines
- redeployed production
- reran the browser proof

Outcome:

- fixed and re-proven

### Scheduled-query destination mismatch

The first reporting transfer config was created with a destination dataset even though the refresh logic was a multi-statement maintenance query.

Result:

- BigQuery Data Transfer Service failed the run with:
  - `Error code 9 : Dataset specified in the query ('') is not consistent with Destination dataset 'hackathon_reporting'.`

Fix:

- moved the refresh logic into a named stored procedure
- replaced the transfer query with:
  - `CALL \`personal-gws-1\`.hackathon_reporting.refresh_reporting_tables();`
- recreated the transfer config without a destination dataset and with the correct `europe` location
- removed the failed transfer config

Outcome:

- fixed and re-proven with a successful transfer run

## Residual risk

The remaining risk is export latency rather than implementation completeness:

- the GA export dataset still has no landed raw `events_*` tables during this audit window
- the reporting shell is therefore connected to the stable reporting dataset and awaits the first landed raw rows before its visuals fill with historic data
- the first page shell is in place, but the final event-commemorative “wow factor” composition can still be expanded once real event-day data exists

## Recommended next check

Within the next export window:

1. re-run the GA export table check
2. confirm `events_intraday_*` landed in `ga4_498363924`
3. re-run the scheduled query if needed
4. confirm the Looker shell begins rendering non-empty history from `hackathon_reporting`

The authoritative implementation notes live in [/Users/rajeev/Code/hackathon-voting-prototype/docs/google-tagging-stack.md](/Users/rajeev/Code/hackathon-voting-prototype/docs/google-tagging-stack.md).
