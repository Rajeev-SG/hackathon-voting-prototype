# Google Tagging Stack

Last updated: `2026-03-24`

## Live stack

- App: `https://vote.rajeevg.com`
- Shared GA4 account: `362795631` (`rajeevg.com`)
- Shared GA4 property: `498363924` (`rajeevg.com main`)
- Voting app web data stream: `14214480224`
- Voting app measurement ID: `G-HT8Z6KR8CX`
- Main-site web data stream retained: `11542983613`
- First-party collection path: `https://vote.rajeevg.com/metrics`
- Live server tagging upstream: `https://sgtm-live-6tmqixdp3a-nw.a.run.app`
- BigQuery dataset: `personal-gws-1:ga4_498363924`
- GCP project: `personal-gws-1`

## What the app now does

- Applies Google Consent Mode defaults before analytics becomes active.
- Presents an in-product consent banner and persistent privacy-settings re-entry point.
- Ships a privacy policy at `/privacy`.
- Pushes a structured app-owned analytics contract into `window.dataLayer`.
- Emits page, interaction, voting, workbook, and judging-lifecycle events with shared runtime context.
- Loads analytics in one of two supported ways:
  - preferred current live path: direct Google tag using `NEXT_PUBLIC_GA_MEASUREMENT_ID`
  - optional future path: GTM web container via `NEXT_PUBLIC_GTM_ID`
- Sends browser hits to the first-party `/metrics` path via `server_container_url`.

## Authoritative repo files

- Analytics contract: [/Users/rajeev/Code/hackathon-voting-prototype/lib/analytics.ts](/Users/rajeev/Code/hackathon-voting-prototype/lib/analytics.ts)
- Consent state model: [/Users/rajeev/Code/hackathon-voting-prototype/lib/consent.ts](/Users/rajeev/Code/hackathon-voting-prototype/lib/consent.ts)
- Site metadata: [/Users/rajeev/Code/hackathon-voting-prototype/lib/site.ts](/Users/rajeev/Code/hackathon-voting-prototype/lib/site.ts)
- Google tag loader: [/Users/rajeev/Code/hackathon-voting-prototype/components/google-tag-script.tsx](/Users/rajeev/Code/hackathon-voting-prototype/components/google-tag-script.tsx)
- Optional GTM loader: [/Users/rajeev/Code/hackathon-voting-prototype/components/tag-manager-script.tsx](/Users/rajeev/Code/hackathon-voting-prototype/components/tag-manager-script.tsx)
- Data-layer instrumentation: [/Users/rajeev/Code/hackathon-voting-prototype/components/analytics-data-layer.tsx](/Users/rajeev/Code/hackathon-voting-prototype/components/analytics-data-layer.tsx)
- Consent UI: [/Users/rajeev/Code/hackathon-voting-prototype/components/consent-manager.tsx](/Users/rajeev/Code/hackathon-voting-prototype/components/consent-manager.tsx)
- Privacy page: [/Users/rajeev/Code/hackathon-voting-prototype/app/privacy/page.tsx](/Users/rajeev/Code/hackathon-voting-prototype/app/privacy/page.tsx)
- Runtime wiring: [/Users/rajeev/Code/hackathon-voting-prototype/app/layout.tsx](/Users/rajeev/Code/hackathon-voting-prototype/app/layout.tsx)
- First-party rewrite: [/Users/rajeev/Code/hackathon-voting-prototype/next.config.mjs](/Users/rajeev/Code/hackathon-voting-prototype/next.config.mjs)
- Analytics acceptance proof: [/Users/rajeev/Code/hackathon-voting-prototype/tests/e2e/analytics-stack.spec.ts](/Users/rajeev/Code/hackathon-voting-prototype/tests/e2e/analytics-stack.spec.ts)

## Event contract

The app emits shared context on nearly every event:

- `event_source`
- `browser_session_id`
- `page_view_id`
- `page_view_sequence`
- `analytics_consent_state`
- `viewport_*`
- `screen_*`
- `timezone`
- `theme`
- `page_title`
- `page_path`
- `page_location`
- `page_type`
- `site_section`
- `route_depth`
- referrer context when present

Hackathon-specific events include:

- `competition_state_snapshot`
- `workbook_upload_started`
- `workbook_upload_failed`
- `workbook_upload_completed`
- `workbook_picker_opened`
- `competition_round_started`
- `competition_round_start_failed`
- `competition_round_finalized`
- `competition_round_finalize_failed`
- `competition_round_reset`
- `competition_round_reset_failed`
- `entry_voting_state_changed`
- `entry_voting_state_change_failed`
- `scoreboard_view_changed`
- `scoreboard_summary_toggled`
- `judge_auth_dialog_opened`
- `judge_auth_email_requested`
- `judge_auth_email_request_failed`
- `judge_auth_completed`
- `judge_auth_verify_failed`
- `judge_auth_google_started`
- `judge_auth_google_failed`
- `vote_dialog_viewed`
- `vote_score_selected`
- `vote_submit_started`
- `vote_submitted`
- `vote_submit_failed`
- `consent_state_updated`
- `consent_preferences_open`
- `page_context`
- `page_engagement_summary`
- `section_view`
- `scroll_depth`

## Promoted GA custom definitions

### Custom dimensions created on `2026-03-24`

- `event_source`
- `competition_status`
- `viewer_role`
- `entry_slug`
- `entry_name`
- `upload_method`
- `workbook_extension`
- `consent_source`
- `viewer_can_vote`
- `viewer_has_vote`
- `entry_voting_open`

### Custom metrics created on `2026-03-24`

- `entry_count`
- `open_entry_count`
- `participating_judge_count`
- `total_remaining_votes`
- `issue_count`
- `imported_project_count`
- `vote_count`
- `aggregate_score`
- `score`

## Runtime environment contract

Production currently uses:

```bash
NEXT_PUBLIC_SITE_URL=https://vote.rajeevg.com
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-HT8Z6KR8CX
NEXT_PUBLIC_SERVER_CONTAINER_URL=https://vote.rajeevg.com/metrics
SGTM_UPSTREAM_ORIGIN=https://sgtm-live-6tmqixdp3a-nw.a.run.app
```

Optional GTM fallback remains supported but is not the current live delivery path:

```bash
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_GTM_SCRIPT_ORIGIN=/metrics
```

## Current architecture decision

The current live implementation uses a direct Google tag plus the existing shared server container.

Why:

- Google Analytics Admin API access was available and strong enough to create the voting-app stream, promote definitions, and update BigQuery export.
- GTM account API access was not available to the service account, and the browser-only GTM UI does not expose a stable automation surface comparable to the Admin API.
- The direct Google tag path still sends first-party hits through the live `/metrics` server-container route and therefore preserves the server-side collection architecture.

## Known vendor constraint

The remaining Google-managed gap is the reporting presentation layer:

- BigQuery export is configured and enabled for the voting-app stream.
- As of this audit window, `bq ls -a -n 20 personal-gws-1:ga4_498363924` still returns no landed export tables.
- The app is collecting live production hits through the first-party server path.
- GTM MCP is config-aligned but still blocked by a Stape OAuth/client-registration loop on the current endpoint hash (`d097dd57096938e420847d7e05ce995f`).
- Looker Studio report creation and high-design manual arrangement do not currently have a usable export-backed reporting model in this environment because the BigQuery tables have not landed yet.

That means the stack is implemented through collection and export, but the final Looker Studio artifact still needs either:

1. manual browser work in Looker Studio, or
2. a future automation path with a stable authenticated browser surface and landed export tables.
