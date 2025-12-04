-- Form registry
CREATE TABLE IF NOT EXISTS form (
  form_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  label TEXT,
  description TEXT,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  is_archived BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE OR REPLACE TRIGGER set_form_updated_at
  BEFORE UPDATE ON form
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Form field registry
CREATE TABLE IF NOT EXISTS form_field (
  form_field_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  label TEXT,
  field_type VARCHAR(100) NOT NULL,
  description TEXT,
  options JSONB NOT NULL DEFAULT '{}'::JSONB,
  picklist_id UUID REFERENCES picklist(picklist_id) ON DELETE SET NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  is_archived BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE OR REPLACE TRIGGER set_form_field_updated_at
  BEFORE UPDATE ON form_field
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Assignment of form fields to forms
CREATE TABLE IF NOT EXISTS form_field_assignment (
  form_field_assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES form(form_id) ON DELETE CASCADE,
  form_field_id UUID NOT NULL REFERENCES form_field(form_field_id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  is_archived BOOLEAN DEFAULT FALSE NOT NULL,
  UNIQUE(form_id, form_field_id)
);
CREATE OR REPLACE TRIGGER set_form_field_assignment_updated_at
  BEFORE UPDATE ON form_field_assignment
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_ffa_form_field
  ON form_field_assignment (form_id, form_field_id);

CREATE INDEX IF NOT EXISTS idx_form_field_assignment_form_sort
  ON form_field_assignment (form_id, sort_order)
  WHERE NOT is_archived;

CREATE INDEX IF NOT EXISTS idx_form_field_assignment_form_field_id
  ON form_field_assignment (form_field_id)
  WHERE NOT is_archived;

-- Get form ID by name or ID
CREATE OR REPLACE FUNCTION get_form_id(name_or_id TEXT)
  RETURNS UUID AS $$
DECLARE
  uid UUID;
BEGIN
  SELECT form_id INTO uid
  FROM form
  WHERE name = name_or_id
     OR form_id = try_cast_uuid(name_or_id)
  LIMIT 1;
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Form not found: %', name_or_id;
  END IF;
  RETURN uid;
END;
$$ LANGUAGE plpgsql;

-- Get form fields for a given form by name or ID
CREATE OR REPLACE FUNCTION get_form_fields(p_form_name_or_id TEXT)
  RETURNS TABLE (
    form_field_id UUID,
    name          VARCHAR,
    label         TEXT,
    field_type    VARCHAR,
    options       JSONB,
    picklist_id   UUID
  ) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ff.form_field_id,
    ff.name,
    ff.label,
    ff.field_type,
    ff.description,
    ff.options,
    ff.picklist_id
  FROM form_field_assignment ffa
  JOIN form_field ff
    ON ff.form_field_id = ffa.form_field_id
  WHERE
    ffa.form_id = get_form_id(p_form_name_or_id)
    AND NOT ffa.is_archived
    AND NOT ff.is_archived
  ORDER BY
    ffa.sort_order,
    ff.name;
END;
$$ LANGUAGE plpgsql;