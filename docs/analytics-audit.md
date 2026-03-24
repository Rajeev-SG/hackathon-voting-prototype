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

- Partial

### Looker Studio presentation artifact

- Partial

The production collection stack is live and evidenced. The remaining gaps are:

- BigQuery export tables have not landed yet in the linked dataset during this audit window.
- the final Looker Studio report build is therefore not yet backed by landed export data
- GTM MCP remains blocked by a Stape OAuth/client-registration loop, which limits the vendor-side automation surface

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

Not yet verified in this same pass:

- landed `events_intraday_*` or `events_*` rows attributable to the new voting stream
- `bq ls -a -n 20 personal-gws-1:ga4_498363924` currently returns no tables

This is an expected latency-sensitive area and should be rechecked after Google’s export pipeline has had time to materialize the new stream traffic.

### GTM MCP state

Verified:

- `gtm_mcp` is enabled in Codex config and now aligned across the mirrored agent configs
- the remote endpoint responds at `https://gtm-mcp.stape.ai/mcp`
- the endpoint currently returns `401` without a bearer token, which confirms OAuth is required

Problem found:

- `mcp-remote` resolves the current GTM endpoint to hash `d097dd57096938e420847d7e05ce995f`
- that hash repeatedly recreates `client_info.json`, `code_verifier.txt`, and `lock.json`
- a live coordinator remains stuck at `http://127.0.0.1:10918/wait-for-auth` with `Authentication in progress`
- even after clearing the broken cache and transplanting an existing Stape token file onto the active hash, `mcp-remote` still emits a fresh authorize URL instead of connecting cleanly

Current conclusion:

- the remaining GTM MCP blocker is no longer config drift
- it behaves like a Stape OAuth or client-registration bug for this client/redirect combination

## Problem found during implementation

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

## Residual risk

The remaining risk is not collection integrity; it is presentation-layer completion:

- Looker Studio report creation and “wow factor” dashboard composition were not completed in this pass
- BigQuery export tables have not landed yet, so there is no export-backed reporting model to build the historic artifact from today
- browser-state inspection confirmed the `Default` Chrome profile maps to `rajeev.sgill@gmail.com`
- GTM MCP is still blocked by the Stape OAuth/client-registration loop described above

That means the analytics stack itself is live, but the final historic visual artifact still needs manual Looker Studio construction or a future authenticated-browser automation pass.

## Recommended next check

Within the next export window:

1. re-run the BigQuery table check
2. confirm `events_intraday_*` landed
3. build or wire the final Looker Studio report from the landed export tables

The authoritative implementation notes live in [/Users/rajeev/Code/hackathon-voting-prototype/docs/google-tagging-stack.md](/Users/rajeev/Code/hackathon-voting-prototype/docs/google-tagging-stack.md).
