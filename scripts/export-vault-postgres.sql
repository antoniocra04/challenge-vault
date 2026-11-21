-- Run with psql -Atq -v ON_ERROR_STOP=1 against the original Vault database.
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL TIME ZONE 'UTC';

SELECT jsonb_build_object(
  'format', 'challenge-vault',
  'version', 1,
  'exportedAt', now(),
  'challenges', COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'id', c.id,
      'title', c.title,
      'description', c.description,
      'spark', c.spark,
      'category', c.category,
      'tags', c.tags,
      'status', c.status,
      'favorite', c.favorite,
      'estimatedDuration', c.estimated_duration,
      'actualDuration', c.actual_duration,
      'requiresLeavingHome', c.requires_leaving_home,
      'requiresMoney', c.requires_money,
      'result', c.result,
      'enjoymentScore', c.enjoyment_score,
      'abandonReason', c.abandon_reason,
      'trackedSeconds', c.tracked_seconds,
      'sessionStartedAt', c.session_started_at,
      'createdAt', c.created_at,
      'updatedAt', c.updated_at,
      'startedAt', c.started_at,
      'completedAt', c.completed_at,
      'abandonedAt', c.abandoned_at,
      'log', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', note.id,
          'kind', note.kind,
          'content', note.content,
          'createdAt', note.created_at
        ) ORDER BY note.created_at, note.id)
        FROM challenge_log_entries AS note
        WHERE note.challenge_id = c.id
      ), '[]'::jsonb),
      'attachments', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', a.id,
          'kind', a.kind,
          'title', a.title,
          'url', a.url,
          'content', a.content,
          'fileName', a.file_name,
          'mimeType', a.mime_type,
          'size', a.size,
          'storageKey', a.storage_key,
          'createdAt', a.created_at
        ) ORDER BY a.created_at, a.id)
        FROM attachments AS a
        WHERE a.challenge_id = c.id
      ), '[]'::jsonb)
    ) ORDER BY c.created_at, c.id)
    FROM challenges AS c
  ), '[]'::jsonb)
);

COMMIT;
