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
      COUNTIF(event_name = 'vote_submitted') AS votes_submitted,
      COUNT(DISTINCT IF(event_name = 'vote_submitted', user_pseudo_id, NULL)) AS unique_voters,
      SUM(IF(event_name = 'vote_submitted', score, 0)) AS total_score,
      AVG(IF(event_name = 'vote_submitted', CAST(score AS FLOAT64), NULL)) AS average_score
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
  END IF;
END;
