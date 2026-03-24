CREATE OR REPLACE PROCEDURE `personal-gws-1.hackathon_reporting.refresh_reporting_tables`()
BEGIN
  DECLARE event_union_sql STRING;

  SET event_union_sql = (
    SELECT STRING_AGG(
      FORMAT(
        "SELECT event_date, event_timestamp, event_name, user_pseudo_id, event_params FROM `%s.%s.%s`",
        table_catalog,
        table_schema,
        table_name
      ),
      " UNION ALL "
    )
    FROM `personal-gws-1.ga4_498363924.INFORMATION_SCHEMA.TABLES`
    WHERE table_name LIKE 'events_%'
  );

  IF event_union_sql IS NOT NULL THEN
    EXECUTE IMMEDIATE FORMAT("""
      CREATE TEMP TABLE raw_events AS
      WITH source_events AS (
        %s
      )
      SELECT
        PARSE_DATE('%%Y%%m%%d', event_date) AS event_date,
        TIMESTAMP_MICROS(event_timestamp) AS event_ts,
        event_name,
        user_pseudo_id,
        COALESCE((SELECT ep.value.string_value FROM UNNEST(event_params) ep WHERE ep.key = 'viewer_role'), 'unknown') AS viewer_role,
        COALESCE((SELECT ep.value.string_value FROM UNNEST(event_params) ep WHERE ep.key = 'competition_status'), 'unknown') AS competition_status,
        NULLIF((SELECT ep.value.string_value FROM UNNEST(event_params) ep WHERE ep.key = 'entry_slug'), '') AS entry_slug,
        NULLIF((SELECT ep.value.string_value FROM UNNEST(event_params) ep WHERE ep.key = 'entry_name'), '') AS entry_name,
        COALESCE((SELECT ep.value.string_value FROM UNNEST(event_params) ep WHERE ep.key = 'analytics_consent_state'), 'unknown') AS analytics_consent_state,
        COALESCE((SELECT ep.value.string_value FROM UNNEST(event_params) ep WHERE ep.key = 'viewport_category'), 'unknown') AS viewport_category,
        COALESCE((SELECT ep.value.string_value FROM UNNEST(event_params) ep WHERE ep.key = 'theme'), 'unknown') AS theme,
        NULLIF((SELECT ep.value.string_value FROM UNNEST(event_params) ep WHERE ep.key = 'board_view'), '') AS board_view,
        COALESCE((SELECT ep.value.string_value FROM UNNEST(event_params) ep WHERE ep.key = 'summary_state'), 'unknown') AS summary_state,
        COALESCE((SELECT ep.value.string_value FROM UNNEST(event_params) ep WHERE ep.key = 'auth_method'), 'unknown') AS auth_method,
        COALESCE((SELECT ep.value.string_value FROM UNNEST(event_params) ep WHERE ep.key = 'auth_flow'), 'unknown') AS auth_flow,
        NULLIF((SELECT ep.value.string_value FROM UNNEST(event_params) ep WHERE ep.key = 'email_domain'), '') AS email_domain,
        COALESCE((SELECT ep.value.string_value FROM UNNEST(event_params) ep WHERE ep.key = 'upload_method'), '') AS upload_method,
        COALESCE((SELECT ep.value.string_value FROM UNNEST(event_params) ep WHERE ep.key = 'workbook_extension'), '') AS workbook_extension,
        COALESCE((SELECT ep.value.string_value FROM UNNEST(event_params) ep WHERE ep.key = 'voting_state'), '') AS voting_state,
        COALESCE(
          (SELECT ep.value.int_value FROM UNNEST(event_params) ep WHERE ep.key = 'score'),
          CAST((SELECT ep.value.double_value FROM UNNEST(event_params) ep WHERE ep.key = 'score') AS INT64),
          0
        ) AS score,
        COALESCE(
          (SELECT ep.value.int_value FROM UNNEST(event_params) ep WHERE ep.key = 'entry_count'),
          0
        ) AS entry_count,
        COALESCE(
          (SELECT ep.value.int_value FROM UNNEST(event_params) ep WHERE ep.key = 'open_entry_count'),
          0
        ) AS open_entry_count,
        COALESCE(
          (SELECT ep.value.int_value FROM UNNEST(event_params) ep WHERE ep.key = 'participating_judge_count'),
          0
        ) AS participating_judge_count,
        COALESCE(
          (SELECT ep.value.int_value FROM UNNEST(event_params) ep WHERE ep.key = 'total_remaining_votes'),
          0
        ) AS total_remaining_votes,
        COALESCE(
          (SELECT ep.value.int_value FROM UNNEST(event_params) ep WHERE ep.key = 'vote_count'),
          0
        ) AS vote_count,
        COALESCE(
          (SELECT ep.value.int_value FROM UNNEST(event_params) ep WHERE ep.key = 'issue_count'),
          0
        ) AS issue_count,
        COALESCE(
          (SELECT ep.value.int_value FROM UNNEST(event_params) ep WHERE ep.key = 'imported_project_count'),
          0
        ) AS imported_project_count,
        COALESCE(
          SAFE_CAST((SELECT ep.value.string_value FROM UNNEST(event_params) ep WHERE ep.key = 'viewer_can_vote') AS BOOL),
          (SELECT ep.value.int_value FROM UNNEST(event_params) ep WHERE ep.key = 'viewer_can_vote') = 1,
          FALSE
        ) AS viewer_can_vote,
        COALESCE(
          SAFE_CAST((SELECT ep.value.string_value FROM UNNEST(event_params) ep WHERE ep.key = 'viewer_has_vote') AS BOOL),
          (SELECT ep.value.int_value FROM UNNEST(event_params) ep WHERE ep.key = 'viewer_has_vote') = 1,
          FALSE
        ) AS viewer_has_vote,
        COALESCE(
          SAFE_CAST((SELECT ep.value.string_value FROM UNNEST(event_params) ep WHERE ep.key = 'entry_voting_open') AS BOOL),
          (SELECT ep.value.int_value FROM UNNEST(event_params) ep WHERE ep.key = 'entry_voting_open') = 1,
          FALSE
        ) AS entry_voting_open,
        COALESCE(
          (SELECT ep.value.int_value FROM UNNEST(event_params) ep WHERE ep.key = 'engaged_seconds_total'),
          0
        ) AS engaged_seconds_total,
        COALESCE(
          (SELECT ep.value.int_value FROM UNNEST(event_params) ep WHERE ep.key = 'interaction_count'),
          0
        ) AS interaction_count,
        COALESCE(
          (SELECT ep.value.int_value FROM UNNEST(event_params) ep WHERE ep.key = 'max_scroll_depth_percent'),
          0
        ) AS max_scroll_depth_percent,
        COALESCE(
          (SELECT ep.value.int_value FROM UNNEST(event_params) ep WHERE ep.key = 'section_views_count'),
          0
        ) AS section_views_count,
        COALESCE(
          (SELECT ep.value.string_value FROM UNNEST(event_params) ep WHERE ep.key = 'consent_source'),
          ''
        ) AS consent_source
      FROM source_events
    """, event_union_sql);

    TRUNCATE TABLE `personal-gws-1.hackathon_reporting.daily_overview`;
    INSERT INTO `personal-gws-1.hackathon_reporting.daily_overview`
    SELECT
      event_date,
      COUNT(*) AS total_events,
      COUNTIF(event_name = 'page_view') AS page_views,
      COUNTIF(event_name = 'session_start') AS sessions,
      COUNT(DISTINCT user_pseudo_id) AS unique_users,
      COUNTIF(event_name = 'judge_auth_completed') AS judge_auth_completions,
      COUNTIF(event_name = 'vote_dialog_viewed') AS vote_dialog_views,
      COUNTIF(event_name = 'vote_submitted') AS vote_submissions,
      COUNTIF(event_name = 'workbook_upload_completed') AS workbook_uploads,
      COUNTIF(event_name = 'competition_round_started') AS round_opens,
      COUNTIF(event_name = 'competition_round_finalized') AS finalizations,
      COUNTIF(event_name = 'consent_state_updated' AND consent_source IN ('banner_accept', 'preferences')) AS consent_grants,
      COUNTIF(viewer_role = 'manager') AS manager_actions,
      SUM(IF(event_name = 'vote_submitted', score, 0)) AS total_score
    FROM raw_events
    GROUP BY event_date;

    TRUNCATE TABLE `personal-gws-1.hackathon_reporting.event_breakdown`;
    INSERT INTO `personal-gws-1.hackathon_reporting.event_breakdown`
    SELECT
      event_date,
      event_name,
      viewer_role,
      competition_status,
      COUNT(*) AS event_count,
      COUNT(DISTINCT user_pseudo_id) AS unique_users
    FROM raw_events
    GROUP BY event_date, event_name, viewer_role, competition_status;

    TRUNCATE TABLE `personal-gws-1.hackathon_reporting.entry_performance`;
    INSERT INTO `personal-gws-1.hackathon_reporting.entry_performance`
    SELECT
      event_date,
      entry_slug,
      ANY_VALUE(entry_name) AS entry_name,
      ANY_VALUE(competition_status) AS competition_status,
      COUNTIF(event_name = 'vote_dialog_viewed') AS dialog_views,
      COUNTIF(event_name = 'vote_dialog_viewed' AND viewer_can_vote AND entry_voting_open AND competition_status = 'open') AS eligible_dialog_views,
      COUNTIF(event_name = 'vote_dialog_viewed' AND NOT (viewer_can_vote AND entry_voting_open AND competition_status = 'open')) AS blocked_dialog_views,
      COUNTIF(event_name = 'vote_submit_started') AS vote_submit_starts,
      COUNTIF(event_name = 'vote_submit_failed') AS vote_submit_failures,
      COUNTIF(event_name = 'vote_submitted') AS votes_submitted,
      COUNT(DISTINCT IF(event_name = 'vote_submitted', user_pseudo_id, NULL)) AS unique_voters,
      SUM(IF(event_name = 'vote_submitted', score, 0)) AS total_score,
      AVG(IF(event_name = 'vote_submitted', CAST(score AS FLOAT64), NULL)) AS average_score,
      SAFE_DIVIDE(
        COUNTIF(event_name = 'vote_submitted'),
        NULLIF(COUNTIF(event_name = 'vote_dialog_viewed' AND viewer_can_vote AND entry_voting_open AND competition_status = 'open'), 0)
      ) AS view_to_vote_rate
    FROM raw_events
    WHERE entry_slug IS NOT NULL
    GROUP BY event_date, entry_slug;

    TRUNCATE TABLE `personal-gws-1.hackathon_reporting.round_snapshots`;
    INSERT INTO `personal-gws-1.hackathon_reporting.round_snapshots`
    WITH ranked_snapshots AS (
      SELECT
        event_date,
        event_ts,
        competition_status,
        entry_count,
        open_entry_count,
        participating_judge_count,
        total_remaining_votes,
        ROW_NUMBER() OVER (PARTITION BY event_date ORDER BY event_ts DESC) AS snapshot_rank
      FROM raw_events
      WHERE event_name = 'competition_state_snapshot'
    )
    SELECT
      event_date,
      event_ts AS latest_event_ts,
      competition_status,
      entry_count,
      open_entry_count,
      participating_judge_count,
      total_remaining_votes
    FROM ranked_snapshots
    WHERE snapshot_rank = 1;

    TRUNCATE TABLE `personal-gws-1.hackathon_reporting.auth_funnel_daily`;
    INSERT INTO `personal-gws-1.hackathon_reporting.auth_funnel_daily`
    SELECT
      event_date,
      auth_method,
      auth_flow,
      COALESCE(email_domain, '(not set)') AS email_domain,
      COUNTIF(event_name = 'judge_auth_email_requested') AS auth_requests,
      COUNTIF(event_name = 'judge_auth_signup_started') AS signup_starts,
      COUNTIF(event_name = 'judge_auth_completed') AS auth_completions,
      COUNTIF(event_name IN ('judge_auth_email_request_failed', 'judge_auth_verify_failed')) AS auth_failures,
      COUNTIF(event_name = 'judge_auth_google_started') AS google_starts,
      COUNTIF(event_name = 'judge_auth_google_failed') AS google_failures,
      COUNT(DISTINCT user_pseudo_id) AS unique_users
    FROM raw_events
    WHERE event_name IN (
      'judge_auth_email_requested',
      'judge_auth_signup_started',
      'judge_auth_completed',
      'judge_auth_email_request_failed',
      'judge_auth_verify_failed',
      'judge_auth_google_started',
      'judge_auth_google_failed'
    )
    GROUP BY event_date, auth_method, auth_flow, email_domain;

    TRUNCATE TABLE `personal-gws-1.hackathon_reporting.voting_funnel_daily`;
    INSERT INTO `personal-gws-1.hackathon_reporting.voting_funnel_daily`
    SELECT
      event_date,
      COALESCE(entry_slug, '(board-level)') AS entry_slug,
      COALESCE(ANY_VALUE(entry_name), '(board-level)') AS entry_name,
      viewer_role,
      viewport_category,
      COUNTIF(event_name = 'vote_dialog_viewed') AS dialog_views,
      COUNTIF(event_name = 'vote_dialog_viewed' AND viewer_can_vote AND entry_voting_open AND competition_status = 'open') AS eligible_dialog_views,
      COUNTIF(event_name = 'vote_dialog_viewed' AND NOT (viewer_can_vote AND entry_voting_open AND competition_status = 'open')) AS blocked_dialog_views,
      COUNTIF(event_name = 'vote_score_selected') AS score_selections,
      COUNTIF(event_name = 'vote_submit_started') AS submit_starts,
      COUNTIF(event_name = 'vote_submitted') AS submitted_votes,
      COUNTIF(event_name = 'vote_submit_failed') AS submit_failures,
      COUNT(DISTINCT IF(event_name IN ('vote_dialog_viewed', 'vote_score_selected', 'vote_submit_started', 'vote_submitted', 'vote_submit_failed'), user_pseudo_id, NULL)) AS unique_viewers,
      COUNT(DISTINCT IF(event_name = 'vote_submitted', user_pseudo_id, NULL)) AS unique_submitters,
      SAFE_DIVIDE(
        COUNTIF(event_name = 'vote_submitted'),
        NULLIF(COUNTIF(event_name = 'vote_dialog_viewed' AND viewer_can_vote AND entry_voting_open AND competition_status = 'open'), 0)
      ) AS submission_rate
    FROM raw_events
    WHERE event_name IN (
      'vote_dialog_viewed',
      'vote_score_selected',
      'vote_submit_started',
      'vote_submitted',
      'vote_submit_failed'
    )
    GROUP BY event_date, entry_slug, viewer_role, viewport_category;

    TRUNCATE TABLE `personal-gws-1.hackathon_reporting.manager_operations_daily`;
    INSERT INTO `personal-gws-1.hackathon_reporting.manager_operations_daily`
    SELECT
      event_date,
      COUNTIF(event_name = 'workbook_picker_opened') AS workbook_picker_opens,
      COUNTIF(event_name = 'workbook_upload_started') AS workbook_upload_starts,
      COUNTIF(event_name = 'workbook_upload_completed') AS workbook_upload_successes,
      COUNTIF(event_name = 'workbook_upload_failed') AS workbook_upload_failures,
      SUM(IF(event_name = 'workbook_upload_failed', issue_count, 0)) AS workbook_issue_total,
      SUM(IF(event_name = 'workbook_upload_completed', imported_project_count, 0)) AS imported_project_total,
      COUNTIF(event_name = 'entry_voting_state_changed' AND voting_state = 'open') AS entry_voting_opened,
      COUNTIF(event_name = 'entry_voting_state_changed' AND voting_state = 'closed') AS entry_voting_closed,
      COUNTIF(event_name = 'competition_round_started') AS round_starts,
      COUNTIF(event_name = 'competition_round_start_failed') AS round_start_failures,
      COUNTIF(event_name = 'competition_round_finalized') AS finalizations,
      COUNTIF(event_name = 'competition_round_finalize_failed') AS finalize_failures,
      COUNTIF(event_name = 'competition_round_reset') AS resets,
      COUNTIF(event_name = 'competition_round_reset_failed') AS reset_failures
    FROM raw_events
    WHERE event_name IN (
      'workbook_picker_opened',
      'workbook_upload_started',
      'workbook_upload_completed',
      'workbook_upload_failed',
      'entry_voting_state_changed',
      'competition_round_started',
      'competition_round_start_failed',
      'competition_round_finalized',
      'competition_round_finalize_failed',
      'competition_round_reset',
      'competition_round_reset_failed'
    )
    GROUP BY event_date;

    TRUNCATE TABLE `personal-gws-1.hackathon_reporting.experience_overview_daily`;
    INSERT INTO `personal-gws-1.hackathon_reporting.experience_overview_daily`
    SELECT
      event_date,
      viewport_category,
      theme,
      analytics_consent_state,
      COALESCE(board_view, '(not set)') AS board_view,
      COUNTIF(event_name = 'page_context') AS page_context_views,
      COUNTIF(event_name = 'page_engagement_summary') AS page_engagement_summaries,
      COUNTIF(event_name = 'scoreboard_summary_toggled' AND summary_state = 'open') AS scoreboard_summary_opened,
      COUNTIF(event_name = 'scoreboard_summary_toggled' AND summary_state = 'closed') AS scoreboard_summary_closed,
      COUNTIF(event_name = 'scoreboard_view_changed' AND board_view = 'table') AS table_view_switches,
      COUNTIF(event_name = 'scoreboard_view_changed' AND board_view = 'chart') AS chart_view_switches,
      SUM(IF(event_name = 'page_engagement_summary', section_views_count, 0)) AS section_views,
      COUNT(DISTINCT user_pseudo_id) AS unique_users,
      AVG(IF(event_name = 'page_engagement_summary', CAST(engaged_seconds_total AS FLOAT64), NULL)) AS avg_engaged_seconds,
      AVG(IF(event_name = 'page_engagement_summary', CAST(interaction_count AS FLOAT64), NULL)) AS avg_interaction_count,
      AVG(IF(event_name = 'page_engagement_summary', CAST(max_scroll_depth_percent AS FLOAT64), NULL)) AS avg_scroll_depth_percent
    FROM raw_events
    WHERE event_name IN (
      'page_context',
      'page_engagement_summary',
      'scoreboard_summary_toggled',
      'scoreboard_view_changed'
    )
    GROUP BY event_date, viewport_category, theme, analytics_consent_state, board_view;
  END IF;
END;
