CREATE SCHEMA IF NOT EXISTS `personal-gws-1.hackathon_reporting`
OPTIONS (
  location = 'EU',
  description = 'Stable reporting tables for the hackathon voting app Looker Studio shell.'
);

CREATE TABLE IF NOT EXISTS `personal-gws-1.hackathon_reporting.daily_overview` (
  event_date DATE,
  total_events INT64,
  page_views INT64,
  sessions INT64,
  unique_users INT64,
  judge_auth_completions INT64,
  vote_dialog_views INT64,
  vote_submissions INT64,
  workbook_uploads INT64,
  round_opens INT64,
  finalizations INT64,
  consent_grants INT64,
  manager_actions INT64,
  total_score INT64
);

CREATE TABLE IF NOT EXISTS `personal-gws-1.hackathon_reporting.event_breakdown` (
  event_date DATE,
  event_name STRING,
  viewer_role STRING,
  competition_status STRING,
  event_count INT64,
  unique_users INT64
);

CREATE TABLE IF NOT EXISTS `personal-gws-1.hackathon_reporting.entry_performance` (
  event_date DATE,
  entry_slug STRING,
  entry_name STRING,
  competition_status STRING,
  dialog_views INT64,
  eligible_dialog_views INT64,
  blocked_dialog_views INT64,
  vote_submit_starts INT64,
  vote_submit_failures INT64,
  votes_submitted INT64,
  unique_voters INT64,
  total_score INT64,
  average_score FLOAT64,
  view_to_vote_rate FLOAT64
);

CREATE TABLE IF NOT EXISTS `personal-gws-1.hackathon_reporting.round_snapshots` (
  event_date DATE,
  latest_event_ts TIMESTAMP,
  competition_status STRING,
  entry_count INT64,
  open_entry_count INT64,
  participating_judge_count INT64,
  total_remaining_votes INT64
);

CREATE TABLE IF NOT EXISTS `personal-gws-1.hackathon_reporting.auth_funnel_daily` (
  event_date DATE,
  auth_method STRING,
  auth_flow STRING,
  email_domain STRING,
  auth_requests INT64,
  signup_starts INT64,
  auth_completions INT64,
  auth_failures INT64,
  google_starts INT64,
  google_failures INT64,
  unique_users INT64
);

CREATE TABLE IF NOT EXISTS `personal-gws-1.hackathon_reporting.voting_funnel_daily` (
  event_date DATE,
  entry_slug STRING,
  entry_name STRING,
  viewer_role STRING,
  viewport_category STRING,
  dialog_views INT64,
  eligible_dialog_views INT64,
  blocked_dialog_views INT64,
  score_selections INT64,
  submit_starts INT64,
  submitted_votes INT64,
  submit_failures INT64,
  unique_viewers INT64,
  unique_submitters INT64,
  submission_rate FLOAT64
);

CREATE TABLE IF NOT EXISTS `personal-gws-1.hackathon_reporting.manager_operations_daily` (
  event_date DATE,
  workbook_picker_opens INT64,
  workbook_upload_starts INT64,
  workbook_upload_successes INT64,
  workbook_upload_failures INT64,
  workbook_issue_total INT64,
  imported_project_total INT64,
  entry_voting_opened INT64,
  entry_voting_closed INT64,
  round_starts INT64,
  round_start_failures INT64,
  finalizations INT64,
  finalize_failures INT64,
  resets INT64,
  reset_failures INT64
);

CREATE TABLE IF NOT EXISTS `personal-gws-1.hackathon_reporting.experience_overview_daily` (
  event_date DATE,
  viewport_category STRING,
  theme STRING,
  analytics_consent_state STRING,
  board_view STRING,
  page_context_views INT64,
  page_engagement_summaries INT64,
  scoreboard_summary_opened INT64,
  scoreboard_summary_closed INT64,
  table_view_switches INT64,
  chart_view_switches INT64,
  section_views INT64,
  unique_users INT64,
  avg_engaged_seconds FLOAT64,
  avg_interaction_count FLOAT64,
  avg_scroll_depth_percent FLOAT64
);

ALTER TABLE `personal-gws-1.hackathon_reporting.entry_performance`
ADD COLUMN IF NOT EXISTS dialog_views INT64,
ADD COLUMN IF NOT EXISTS eligible_dialog_views INT64,
ADD COLUMN IF NOT EXISTS blocked_dialog_views INT64,
ADD COLUMN IF NOT EXISTS vote_submit_starts INT64,
ADD COLUMN IF NOT EXISTS vote_submit_failures INT64,
ADD COLUMN IF NOT EXISTS view_to_vote_rate FLOAT64;
