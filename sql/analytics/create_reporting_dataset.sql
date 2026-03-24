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
  votes_submitted INT64,
  unique_voters INT64,
  total_score INT64,
  average_score FLOAT64
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
