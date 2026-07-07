# Reference Statistics Application
Application for collecting and reporting librarian reference interactions.

In active development.

todo: 
- health endpoint
- superset
  - import assets, do RLS
  - reverse proxy url - `SUPERSET_APPLICATION_ROOT=/dashboards` in env

## Superset

Superset runs as a separate service sharing the same Postgres instance. The main dataset for dashboards is the `form_entry_full` view (`postgres` database), which aggregates all form field values into a single `fields` JSONB column.

### Row Level Security
To limit users to only their own submissions, create a "Row Level Security" entry:
| Field | Value |
| ----- | ----- |
| Filter Type | Base |
| Excluded Roles | Admin, Alpha |
| Clause | `submitted_by = '{{ current_username() }}'` |


### Connecting to the database

Add a new database connection in **Settings → Database Connections** using:

```
postgresql+psycopg2://postgres:localhost@db:5432/postgres
```

Then create a dataset from the `form_entry_full` view. Filter to latest versions only by adding `is_latest_version = true` to the dataset's WHERE clause, or handle it in individual chart queries.

### Extracting form fields as columns

Because field values are stored in the `fields` JSONB column, they are not directly available as chart dimensions or metrics. Add them as **Calculated Columns** in the dataset editor (Dataset → Edit → Calculated Columns tab).

| Field name | Label | Expression | Type | Dimension? |
|---|---|---|---|---|
| `event-date` | Event/Transaction Date | `(fields->>'event-date')::date` | DATE | Yes (temporal) |
| `event-count` | Number of Events/Transactions | `(fields->>'event-count')::numeric` | NUMERIC | No (metric) |
| `virtual-event-count` | Number of Virtual Events/Transactions | `(fields->>'virtual-event-count')::numeric` | NUMERIC | No (metric) |
| `person-count` | Number of People | `(fields->>'person-count')::numeric` | NUMERIC | No (metric) |
| `event-duration` | Event/Transaction Duration (minutes) | `(fields->>'event-duration')::numeric` | NUMERIC | No (metric) |
| `ucd-constituency` | UC Davis Constituency | `fields->>'ucd-constituency'` | TEXT | Yes |
| `instruction-session-type` | Instruction Session Type | `fields->>'instruction-session-type'` | TEXT | Yes |
| `outreach-type` | Outreach Type | `fields->>'outreach-type'` | TEXT | Yes |
| `reference-topic` | Reference Topic | `fields->>'reference-topic'` | TEXT | Yes |
| `instruction-session-title` | Instruction Session Title | `fields->>'instruction-session-title'` | TEXT | Yes |
| `ucd-community-organization` | UC Davis or Community Organization | `fields->>'ucd-community-organization'` | TEXT | Yes |
| `notes` | Notes | `fields->>'notes'` | TEXT | Yes |

Numeric fields should be turned into metrics (e.g. `SUM(event-count)`) in the **Metrics** tab rather than used as raw columns in charts.