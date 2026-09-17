CREATE TABLE IF NOT EXISTS student_assistant_assignment (
  student_assistant_assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(200) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  form_id UUID NOT NULL REFERENCES form(form_id) ON DELETE CASCADE,
  group_id INTEGER NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  created_by VARCHAR(200) REFERENCES users(user_id) ON DELETE SET NULL,
  UNIQUE(user_id, form_id, group_id)
);

-- Student assistant users with all their assigned forms/groups aggregated into arrays
CREATE OR REPLACE VIEW student_assistant_assignment_full AS
SELECT
  u.user_id,
  u.first_name,
  u.last_name,
  u.email,
  COALESCE(f_forms.forms, '[]'::jsonb) AS forms,
  COALESCE(f_groups.groups, '[]'::jsonb) AS groups

FROM (
  SELECT DISTINCT user_id FROM student_assistant_assignment
) saa

JOIN users u
  ON u.user_id = saa.user_id

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
  FROM (
    SELECT DISTINCT form_id FROM student_assistant_assignment WHERE user_id = u.user_id
  ) saa_form
  JOIN form f
    ON f.form_id = saa_form.form_id
) AS f_forms ON TRUE

LEFT JOIN LATERAL (
  SELECT
    jsonb_agg(
      jsonb_build_object(
        'group_id', g.group_id,
        'name', g.name
      )
      ORDER BY g.name
    ) AS groups
  FROM (
    SELECT DISTINCT group_id FROM student_assistant_assignment WHERE user_id = u.user_id
  ) saa_group
  JOIN groups g
    ON g.group_id = saa_group.group_id
) AS f_groups ON TRUE;