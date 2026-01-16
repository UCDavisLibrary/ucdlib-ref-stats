CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS picklist (
  picklist_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  is_archived BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE OR REPLACE TRIGGER set_picklist_updated_at
  BEFORE UPDATE ON picklist
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_picklist_active
  ON picklist (name)
  WHERE NOT is_archived;

CREATE INDEX IF NOT EXISTS idx_picklist_label_trgm
  ON picklist
  USING GIN (label gin_trgm_ops);

CREATE OR REPLACE FUNCTION get_picklist_id(name_or_id TEXT)
  RETURNS UUID AS $$
DECLARE
  uid UUID;
BEGIN
  SELECT picklist_id INTO uid
  FROM picklist
  WHERE name = name_or_id
     OR picklist_id = try_cast_uuid(name_or_id);

  IF uid IS NULL THEN
    RAISE EXCEPTION USING
      MESSAGE = format('Picklist not found: %s', name_or_id),
      ERRCODE = 'P4040';
  END IF;

  RETURN uid;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS picklist_item (
  picklist_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  picklist_id UUID NOT NULL REFERENCES picklist(picklist_id) ON DELETE CASCADE,
  value VARCHAR(255) NOT NULL,
  label TEXT,
  description TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::JSONB,
  sort_order INTEGER NOT NULL DEFAULT 0,
  include_segment TEXT[] NOT NULL DEFAULT '{}',
  exclude_segment TEXT[] NOT NULL DEFAULT '{}',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  is_archived BOOLEAN DEFAULT FALSE NOT NULL,
  UNIQUE(picklist_id, value)
);

-- set updated_at trigger for picklist_item
CREATE OR REPLACE TRIGGER set_picklist_item_updated_at
  BEFORE UPDATE ON picklist_item
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Indexes for picklist_item
CREATE INDEX IF NOT EXISTS idx_picklist_item_picklist_id ON picklist_item (picklist_id);

CREATE INDEX IF NOT EXISTS idx_picklist_item_picklist_active
  ON picklist_item (picklist_id)
  WHERE NOT is_archived;

CREATE INDEX IF NOT EXISTS idx_picklist_item_include_segment
  ON picklist_item USING GIN (include_segment);

CREATE INDEX IF NOT EXISTS idx_picklist_item_exclude_segment
  ON picklist_item USING GIN (exclude_segment);

CREATE INDEX IF NOT EXISTS idx_picklist_item_label_trgm
  ON picklist_item
  USING GIN (label gin_trgm_ops);



-- Function to get picklist items based on picklist name or ID and optional item segments
CREATE OR REPLACE FUNCTION get_picklist_items(
  p_picklist_name_or_id TEXT,
  p_segments            TEXT[] DEFAULT NULL
)
RETURNS SETOF picklist_item
LANGUAGE sql
AS $$
  SELECT pi.*
  FROM picklist_item pi
  JOIN picklist p ON p.picklist_id = get_picklist_id(p_picklist_name_or_id)
  WHERE
    pi.picklist_id = p.picklist_id

    AND (
      -- no segments provided - only global items
      (
        (p_segments IS NULL OR cardinality(p_segments) = 0)
        AND cardinality(pi.include_segment) = 0
      )

      OR

      -- segments provided - filter based on include/exclude logic
      (
        (p_segments IS NOT NULL AND cardinality(p_segments) > 0)
        AND (
          cardinality(pi.include_segment) = 0      -- global
          OR pi.include_segment && p_segments      -- overlaps include
        )
        AND NOT (pi.exclude_segment && p_segments) -- exclude blockers
      )
    )
  ORDER BY
    pi.sort_order,
    pi.label;
$$;

CREATE OR REPLACE VIEW picklist_with_items AS
SELECT
  p.picklist_id,
  p.name,
  p.label,
  p.description,
  p.created_at,
  p.updated_at,
  p.is_archived,

  COALESCE(
    jsonb_agg(to_jsonb(pi) ORDER BY pi.sort_order, pi.label)
      FILTER (WHERE pi.picklist_item_id IS NOT NULL),
    '[]'::jsonb
  ) AS items

FROM picklist p
LEFT JOIN picklist_item pi
  ON pi.picklist_id = p.picklist_id
GROUP BY
  p.picklist_id,
  p.name,
  p.label,
  p.description,
  p.created_at,
  p.updated_at,
  p.is_archived;