-- Adds sort_order to dashboard and rebuilds dashboard_full to include it.
-- Safe to run multiple times. Does not modify existing data.
-- Usage: ./devops/cmds/run-sql.sh services/pg/migrations/001-dashboard-sort-order.sql <env>
\set ON_ERROR_STOP on

BEGIN;

ALTER TABLE dashboard ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- d.* is expanded at view creation, so the view must be dropped and recreated to pick up the new column
DROP VIEW IF EXISTS dashboard_full;

CREATE VIEW dashboard_full AS
SELECT
  d.*,
  COALESCE(f_forms.forms, '[]'::jsonb) AS forms

FROM dashboard d

LEFT JOIN LATERAL (
  SELECT
    jsonb_agg(
      jsonb_build_object(
        'form_id', f.form_id,
        'name', f.name,
        'label', f.label,
        'is_archived', f.is_archived
      )
      ORDER BY f.name
    ) AS forms
  FROM dashboard_to_form dtf
  JOIN form f
    ON f.form_id = dtf.form_id
  WHERE dtf.dashboard_id = d.dashboard_id
) AS f_forms ON TRUE;

COMMIT;
