# Generate Fake Form Entry Data

Instructions for Claude to generate and insert fake form submission data into the ref-stats PostgreSQL database. Used to populate the database for Superset dashboard development.

---

## Ask the user for these parameters before starting

- **IAM_GROUP_IDS** — comma-separated group IDs from the Library IAM API to pass as the `department` parameter (e.g. `24,25`). These are IAM-system identifiers and may differ from the database `group_id` values.
- **MAX_SUBMISSIONS** — total number of form entries to insert, distributed roughly equally across the three forms
- **DATE_RANGE_MONTHS** — how many months back to spread `event-date` values (default: `12`)

IAM credentials are read automatically from the `.env` file — do not ask the user for them.

---

## Step 1 — Read IAM credentials

Read the file `devops/compose/ucdlib-ref-stats-local-dev/.env` and extract:
- `UCDLIB_PERSONNEL_API_USER`
- `UCDLIB_PERSONNEL_API_KEY`

---

## Step 2 — Fetch employees from the Library IAM API

**Request:**
```
GET https://iam.staff.library.ucdavis.edu/json/employees?department={GROUP_IDS}
Authorization: Basic {base64(USER:KEY)}
```

Use the native `fetch` API or `curl`. Build the `Authorization` header by base64-encoding `USER:KEY`.

Inspect the response to identify the field names for user ID, first name, last name, and email. Each employee object has a `groups` property (array) — match the group names there against the groups table (`group_id` 24 = `Academic Engagement and Learning`, 25 = `Research and Health Sciences`) to determine which `group_id` to assign each user.

For each employee record extract:
- `user_id` — the employee's kerberos / user identifier
- `first_name`, `last_name`, `email` — for the users table
- `group_id` — resolved from the `groups` array on the employee object

If a user belongs to multiple requested groups, pick one group_id randomly for each of their submissions.

---

## Step 3 — Query the database for IDs

Run these queries via `docker compose exec db psql -U postgres` from the `devops/compose/ucdlib-ref-stats-local-dev/` directory:

```sql
-- Get form IDs
SELECT form_id, name FROM form WHERE is_archived = false ORDER BY name;

-- Get field IDs and types
SELECT form_field_id, name, field_type FROM form_field WHERE is_archived = false ORDER BY name;

-- Get picklist item IDs, values, and labels
SELECT pi.picklist_item_id, p.name AS picklist_name, pi.value, pi.label
FROM picklist_item pi
JOIN picklist p ON p.picklist_id = pi.picklist_id
WHERE p.is_archived = false
ORDER BY p.name, pi.sort_order;
```

Map the results so you can look up IDs by name throughout the rest of the steps.

---

## Step 4 — Insert groups and users

Derive the groups to insert from the `groups` arrays on the employee objects returned by the IAM API — do not hardcode group IDs or names. Cross-reference with the database `groups` table to find or confirm the `group_id` values:

```sql
SELECT group_id, name FROM groups;
```

Then insert any groups that are missing and all users:

```sql
-- Insert groups if not already present (names and IDs from IAM response)
INSERT INTO groups (group_id, name)
VALUES ('{group_id}', '{name}'), ...
ON CONFLICT (group_id) DO NOTHING;

-- Insert users from IAM API (one row per unique employee)
INSERT INTO users (user_id, first_name, last_name, email)
VALUES ('{user_id}', '{first_name}', '{last_name}', '{email}'), ...
ON CONFLICT (user_id) DO NOTHING;
```

---

## Step 5 — Generate form entries

Distribute MAX_SUBMISSIONS roughly equally across the three forms (`reference`, `instruction`, `outreach`). For each entry:

- Pick a random user from the IAM member list
- Use that user's `group_id`
- Pick a random `created_at` timestamp within the last DATE_RANGE_MONTHS months
- Use the same date (formatted as `YYYY-MM-DD`) for the `event-date` field value

**Insert pattern — run for each entry:**

```sql
-- 1. Insert the form entry
INSERT INTO form_entry (form_id, submitted_by, group_id, created_at)
VALUES ('{form_id}', '{user_id}', {group_id}, '{iso_timestamp}')
RETURNING form_entry_id;

-- 2. Insert field values using the returned form_entry_id
INSERT INTO form_entry_field_value (form_entry_id, form_field_id, value, value_json, picklist_item_id)
VALUES
  ('{entry_id}', '{field_id}', '{value}', '{value_json}'::jsonb, {picklist_item_id or NULL}),
  ...;
```

**`value` and `value_json` column rules:**

| Field type | `value` | `value_json` | `picklist_item_id` |
|---|---|---|---|
| `number` | string of the number, e.g. `'5'` | JSON number, e.g. `5` | NULL |
| `date` | ISO date string, e.g. `'2025-03-15'` | JSON string, e.g. `"2025-03-15"` | NULL |
| `textarea` | the text | JSON string, e.g. `"some text"` | NULL |
| `select` | the picklist **label** (trigger sets this; set it explicitly anyway) | JSON string of the picklist **value** (slug), e.g. `"faculty"` | the `picklist_item_id` |

Note: A `BEFORE INSERT` trigger auto-populates `value` from `picklist_item.label` when `picklist_item_id` is set, but set `value` explicitly to the label anyway to be safe.

Optional fields: include them in ~75% of entries (skip in the remaining ~25%).

---

## Step 6 — Field rules per form

### reference form

| Field | Type | Required | Generation rule |
|---|---|---|---|
| `event-date` | date | always | random date within DATE_RANGE_MONTHS |
| `event-count` | number | always | random integer 1–10 |
| `virtual-event-count` | number | always | random integer 0 to event-count |
| `person-count` | number | always | random integer 1–20 |
| `ucd-constituency` | select | optional (75%) | random item from `ucd-constituency` picklist |
| `reference-topic` | select | only if group_id = 25 | random item from `reference-topic` picklist |
| `event-duration` | number | only if group_id = 24 | random integer 15–120 (minutes) |

### instruction form

| Field | Type | Required | Generation rule |
|---|---|---|---|
| `event-date` | date | always | random date within DATE_RANGE_MONTHS |
| `event-count` | number | always | random integer 1–5 |
| `virtual-event-count` | number | always | random integer 0 to event-count |
| `person-count` | number | always | random integer 5–50 |
| `instruction-session-type` | select | optional (75%) | random item from `instruction-session-type` picklist |
| `instruction-session-title` | textarea | optional (75%) | short placeholder, e.g. `'Library Research Session'` |
| `notes` | textarea | optional (75%) | short placeholder, e.g. `'No additional notes.'` |
| `event-duration` | number | only if group_id = 24 | random integer 30–180 (minutes) |

### outreach form

| Field | Type | Required | Generation rule |
|---|---|---|---|
| `event-date` | date | always | random date within DATE_RANGE_MONTHS |
| `event-count` | number | always | random integer 1–3 |
| `person-count` | number | always | random integer 10–100 |
| `ucd-constituency` | select | always | random item from `ucd-constituency` picklist |
| `outreach-type` | select | optional (75%) | random item from `outreach-type` picklist |
| `ucd-community-organization` | textarea | optional (75%) | short placeholder, e.g. `'UC Davis Library'` |
| `notes` | textarea | optional (75%) | short placeholder, e.g. `'No additional notes.'` |

---

## Known picklist values (from initial hydration)

### ucd-constituency
`undergraduate-students`, `graduate-professional-students`, `postdocs-visiting-scholars`, `faculty`, `staff`, `residents-fellows`, `prospective-students-families`, `alumni-donors`, `community-members`, `k-12-students`, `multiple-audiences`, `other`

### instruction-session-type
`course-related-or-integrated-instruction`, `workshop`, `presentation-lecture`, `orientation`, `tour`, `other`

### outreach-type
`tabling-event`, `resource-fair`, `open-house`, `community-engagement-activity`, `promotional-event`, `other`

### reference-topic
`coursework-assignment`, `research-project`, `publication-scholarly-communication`, `grant-funding-proposal`, `teaching-course-design`, `data-gis-digital-scholarship`, `citation-management`, `other`

---

## Step 7 — Execute

Generate the full SQL as a single script. Pipe it into the database from the compose directory:

```bash
cd devops/compose/ucdlib-ref-stats-local-dev
docker compose exec -T db psql -U postgres < /tmp/fake-data.sql
```

Or write it to a temp file in the scratchpad and pipe from there.

---

## Step 8 — Verify

```sql
SELECT form_name, COUNT(*) AS entries
FROM form_entry_full
WHERE is_latest_version = true
GROUP BY form_name
ORDER BY form_name;
```

Expected: three rows, each with roughly MAX_SUBMISSIONS / 3 entries.
