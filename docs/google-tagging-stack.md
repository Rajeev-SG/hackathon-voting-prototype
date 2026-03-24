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

#### Dimension definitions

- `event_source`
  - Plain meaning: which part of the app emitted the event.
  - Typical values: `scoreboard`, `vote_dialog`, `judge_auth`, `manager_controls`, `consent_banner`.
  - Use it for: separating manager actions, judge actions, and passive board viewing in reports.
- `competition_status`
  - Plain meaning: the round state at the time of the event.
  - Typical values: `preparing`, `open`, `finalized`.
  - Use it for: splitting behavior before judging opens, during live voting, and after finalization.
- `viewer_role`
  - Plain meaning: what kind of user the app believes this visitor is in the current moment.
  - Typical values: `public`, `judge`, `manager`.
  - Use it for: comparing anonymous viewers, authenticated judges, and the single manager.
- `entry_slug`
  - Plain meaning: the stable project identifier used in the app for a specific entry.
  - Typical values: slugified project names such as `team-nova` or `smart-logistics`.
  - Use it for: project-level drilldowns and joining related events across the same entry.
- `entry_name`
  - Plain meaning: the human-readable project name shown in the interface.
  - Typical values: the uploaded project title from the workbook.
  - Use it for: report labels, scorecards, and stakeholder-friendly charts.
- `upload_method`
  - Plain meaning: how the workbook import was initiated.
  - Typical values: `drag_drop`, `file_picker`.
  - Use it for: understanding whether managers naturally prefer drag-and-drop or manual selection.
- `workbook_extension`
  - Plain meaning: the file type uploaded by the manager.
  - Typical values: `xlsx`.
  - Use it for: validating that the intended workbook format is actually what gets used on the day.
- `consent_source`
  - Plain meaning: which consent control changed the visitor’s analytics choice.
  - Typical values: `default`, `banner_accept`, `banner_decline`, `preferences`.
  - Use it for: seeing whether consent is mostly decided at first banner view or later from privacy settings.
- `viewer_can_vote`
  - Plain meaning: whether the current signed-in viewer is allowed to vote on the entry tied to the event.
  - Typical values: `true`, `false`.
  - Use it for: segmenting successful voting opportunities from blocked or read-only views.
- `viewer_has_vote`
  - Plain meaning: whether the current viewer has already cast a score for the entry tied to the event.
  - Typical values: `true`, `false`.
  - Use it for: identifying fresh voting opportunities versus already-completed judging.
- `entry_voting_open`
  - Plain meaning: whether this specific project is currently accepting votes.
  - Typical values: `true`, `false`.
  - Use it for: explaining why some entries attract vote attempts while others are intentionally paused.

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

#### Metric definitions

- `entry_count`
  - Plain meaning: how many projects are currently loaded into the active scoreboard snapshot.
  - Unit: count.
  - Use it for: validating workbook import completeness and understanding board size over time.
- `open_entry_count`
  - Plain meaning: how many projects are currently open for voting.
  - Unit: count.
  - Use it for: checking whether the manager has paused any entries and how much of the field is still live.
- `participating_judge_count`
  - Plain meaning: how many judges are currently counted in the round denominator because they have started scoring.
  - Unit: count.
  - Use it for: understanding actual judging participation, not just total sign-ins.
- `total_remaining_votes`
  - Plain meaning: how many vote obligations are still outstanding across all open entries for participating judges.
  - Unit: count.
  - Use it for: the manager’s “how much judging is left?” view and finalization readiness.
- `issue_count`
  - Plain meaning: how many validation issues were found in a workbook upload attempt.
  - Unit: count.
  - Use it for: spotting messy imports and quantifying workbook quality problems.
- `imported_project_count`
  - Plain meaning: how many projects were successfully accepted from a workbook upload.
  - Unit: count.
  - Use it for: confirming upload success and comparing successful imports against attempted uploads.
- `vote_count`
  - Plain meaning: the number of votes represented by the event payload or competition snapshot.
  - Unit: count.
  - Use it for: measuring judging throughput and vote accumulation over time.
- `aggregate_score`
  - Plain meaning: the current summed scoreboard score for a project.
  - Unit: score points.
  - Use it for: trend charts, leaderboard movement, and project-level comparisons.
- `score`
  - Plain meaning: the single 0-10 score chosen by a judge in an individual vote event.
  - Unit: score points.
  - Use it for: score distribution analysis, judge behavior, and outlier review.

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
