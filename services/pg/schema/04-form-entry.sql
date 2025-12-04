-- Form entries
CREATE TABLE IF NOT EXISTS form_entry (
  form_entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES form(form_id) ON DELETE CASCADE,
  submitted_by TEXT, -- todo: link to user table when available
  impersonated_by TEXT, -- todo: link to user table when available
  original_form_entry_id UUID REFERENCES form_entry(form_entry_id) ON DELETE SET NULL,
  is_latest_version BOOLEAN NOT NULL DEFAULT TRUE,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_form_entry_form_id_created_at
  ON form_entry (form_id, created_at);

CREATE INDEX IF NOT EXISTS idx_form_entry_original_id
  ON form_entry (original_form_entry_id);

CREATE INDEX IF NOT EXISTS idx_form_entry_original_created
  ON form_entry (original_form_entry_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS form_entry_unique_latest
  ON form_entry ((COALESCE(original_form_entry_id, form_entry_id)))
  WHERE is_latest_version;

-- Trigger to set is_latest_version flag
CREATE OR REPLACE FUNCTION form_entry_set_latest()
RETURNS TRIGGER AS $$
DECLARE
  v_root_id UUID;
BEGIN
  v_root_id := COALESCE(NEW.original_form_entry_id, NEW.form_entry_id);
  NEW.is_latest_version := TRUE;
  UPDATE form_entry
  SET is_latest_version = FALSE
  WHERE COALESCE(original_form_entry_id, form_entry_id) = v_root_id
    AND form_entry_id <> NEW.form_entry_id
    AND is_latest_version = TRUE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_form_entry_set_latest
  BEFORE INSERT ON form_entry
  FOR EACH ROW
  EXECUTE FUNCTION form_entry_set_latest();

-- Only most recent version of each form entry
CREATE OR REPLACE VIEW form_entry_latest AS
SELECT *
FROM form_entry
WHERE is_latest_version = TRUE;

-- Form entry field values
CREATE TABLE IF NOT EXISTS form_entry_field_value (
  form_entry_field_value_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_entry_id UUID NOT NULL REFERENCES form_entry(form_entry_id) ON DELETE CASCADE,
  form_field_id UUID NOT NULL REFERENCES form_field(form_field_id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  picklist_item_id UUID REFERENCES picklist_item(picklist_item_id) ON DELETE SET NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  UNIQUE (form_entry_id, form_field_id)
);

-- Trigger to set form_entry_field_value.value from picklist_item.label if picklist_item_id is set
CREATE OR REPLACE FUNCTION set_form_entry_value_from_picklist()
RETURNS TRIGGER AS $$
DECLARE
  v_label TEXT;
BEGIN
  IF NEW.picklist_item_id IS NOT NULL THEN
    SELECT
      COALESCE(pi.label, pi.value)
    INTO v_label
    FROM picklist_item pi
    WHERE pi.picklist_item_id = NEW.picklist_item_id;

    IF v_label IS NULL THEN
      RAISE EXCEPTION 'Picklist item % not found or has no label/value', NEW.picklist_item_id;
    END IF;

    NEW.value := v_label;
  END IF;

  IF NEW.value IS NULL THEN
    RAISE EXCEPTION 'form_entry_field_value.value must not be NULL (form_entry_id=%, form_field_id=%)',
      NEW.form_entry_id, NEW.form_field_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_form_entry_value_from_picklist
  BEFORE INSERT OR UPDATE ON form_entry_field_value
  FOR EACH ROW
  EXECUTE FUNCTION set_form_entry_value_from_picklist();

CREATE INDEX IF NOT EXISTS idx_form_entry_field_value_entry_id
  ON form_entry_field_value (form_entry_id);

CREATE INDEX IF NOT EXISTS idx_form_entry_field_value_form_field_id
  ON form_entry_field_value (form_field_id);
  

CREATE OR REPLACE VIEW form_entry_with_fields AS
SELECT
  fe.form_entry_id,
  fe.form_id,
  fe.created_at,
  fe.submitted_by,
  fe.impersonated_by,
  fe.original_form_entry_id,
  fe.is_latest_version,
  COALESCE(
    jsonb_object_agg(ff.name, fev.value ORDER BY ff.name),
    '{}'::jsonb
  ) AS fields
FROM form_entry fe
LEFT JOIN form_entry_field_value fev
  ON fev.form_entry_id = fe.form_entry_id
LEFT JOIN form_field ff
  ON ff.form_field_id = fev.form_field_id
GROUP BY
  fe.form_entry_id,
  fe.form_id,
  fe.created_at,
  fe.submitted_by,
  fe.impersonated_by,
  fe.is_latest_version,
  fe.original_form_entry_id;

CREATE OR REPLACE VIEW form_entry_latest_with_fields AS
SELECT *
FROM form_entry_with_fields
WHERE is_latest_version = TRUE;