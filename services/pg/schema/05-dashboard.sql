-- Dashboard registry
CREATE TABLE IF NOT EXISTS dashboard (
  dashboard_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  label TEXT,
  description TEXT,
  intro TEXT,
  superset_dashboard_id TEXT,
  superset_dashboard_ui_config JSONB NOT NULL DEFAULT '{}'::JSONB,
  superset_rls JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  is_archived BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE OR REPLACE TRIGGER set_dashboard_updated_at
  BEFORE UPDATE ON dashboard
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_dashboard_label_trgm
  ON dashboard
  USING GIN (label gin_trgm_ops);

-- Many-to-many mapping between dashboards and forms
CREATE TABLE IF NOT EXISTS dashboard_to_form (
  dashboard_to_form_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES dashboard(dashboard_id) ON DELETE CASCADE,
  form_id UUID NOT NULL REFERENCES form(form_id) ON DELETE CASCADE,
  UNIQUE(dashboard_id, form_id)
);

CREATE INDEX IF NOT EXISTS idx_dashboard_to_form_dashboard
  ON dashboard_to_form (dashboard_id);

CREATE INDEX IF NOT EXISTS idx_dashboard_to_form_form
  ON dashboard_to_form (form_id);

-- Get dashboard ID by name or UUID
CREATE OR REPLACE FUNCTION get_dashboard_id(name_or_id TEXT)
  RETURNS UUID AS $$
DECLARE
  uid UUID;
BEGIN
  SELECT dashboard_id INTO uid
  FROM dashboard
  WHERE name = name_or_id
     OR dashboard_id = try_cast_uuid(name_or_id)
  LIMIT 1;
  IF uid IS NULL THEN
    RAISE EXCEPTION USING
      MESSAGE = format('Dashboard not found: %s', name_or_id),
      ERRCODE = 'P4040';
  END IF;
  RETURN uid;
END;
$$ LANGUAGE plpgsql;

-- Full dashboard view with aggregated associated forms
CREATE OR REPLACE VIEW dashboard_full AS
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
