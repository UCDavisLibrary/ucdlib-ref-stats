# Archive Migration
Prior to the development of this application, library service statistics were spread across multiple data sources/applications. Due to significant schema changes, loading the old data into this database is unrealistic. The old data should still be accessible, so it will be loaded into a separate database on the same postgres instance, which can be exposed to Superset as a datasource.

## Data Sources

### Reference Desk Statistics
Has interaction counts for different reference desks, which is not tied to an individual but to a group/department.

Application is on `bigsys`, and data are stored in `db1`.

```sql
SELECT
	rd.*,
    g.name as group_name,
    u.username,
    u.kerberos_id,
    u.lastname,
    u.firstname,
    u.email as user_email
FROM
	statistics.refdesk rd
LEFT JOIN statistics.refdesk_groups g ON g.id = rd.group_id
LEFT JOIN directory.lib_user u on u.userid = rd.userid;
```

### Individual Reference Statistics

Monthly counts of reference interactions for individual librarians.

Application is on `bigsys`, and data are stored in `db1`.

```sql
SELECT
	rs.*,
    g.name as group_name,
    u.username,
    u.kerberos_id,
    u.lastname,
    u.firstname,
    u.email as user_email
FROM
	statistics.refstats rs
LEFT JOIN statistics.refstats_groups g ON g.id = rs.group_id
LEFT JOIN directory.lib_user u on u.userid = rs.userid;
```

### Instruction Statistics

Application is on `bigsys`, data stored in `db1`. Main fact table is `statistics`; participant counts and session metadata are joined from a set of `list_*` lookup tables.

**One row per session (primary instructor only):**

```sql
SELECT
    s.id,
    s.session_date,
    s.submit_date,
    dept.name                   AS department_name,
    dept.code                   AS department_code,
    st.name                     AS session_type,
    cat.name                    AS category,
    t.name                      AS topic,
    s.topic_other,
    loc.name                    AS location,
    s.num_faculty,
    s.num_graduate,
    s.num_undergrad,
    s.num_staff,
    s.num_postdoc,
    s.num_professional,
    s.num_other,
    (COALESCE(s.num_faculty, 0) + COALESCE(s.num_graduate, 0) + COALESCE(s.num_undergrad, 0)
        + COALESCE(s.num_staff, 0) + COALESCE(s.num_postdoc, 0) + COALESCE(s.num_professional, 0)
        + COALESCE(s.num_other, 0)) AS total_participants,
    s.contact_hours,
    s.preparation_hours,
    COALESCE(gn.name, s.groupname, s.groupname_other) AS group_name,
    s.coursename,
    s.notes,
    s.dei_focus,
    aff.name                    AS affiliation,
    sub.lastname                AS submitted_by_lastname,
    sub.firstname               AS submitted_by_firstname,
    sub.username                AS submitted_by_username,
    sub.kerberos_id             AS submitted_by_kerberos_id,
    inst_user.lastname          AS instructor_lastname,
    inst_user.firstname         AS instructor_firstname,
    inst_user.username          AS instructor_username,
    inst_user.kerberos_id       AS instructor_kerberos_id,
    inst_dept.name              AS instructor_department,
    req.firstname               AS requestor_firstname,
    req.lastname                AS requestor_lastname,
    req.email                   AS requestor_email,
    req.dept                    AS requestor_dept
FROM statistics s
LEFT JOIN list_department dept      ON dept.id = s.department_id
LEFT JOIN list_session_type st      ON st.id = s.sessiontype_id
LEFT JOIN list_category cat         ON cat.id = s.category_id
LEFT JOIN list_topic t              ON t.id = s.topic_id
LEFT JOIN list_location loc         ON loc.id = s.location_id
LEFT JOIN list_groupname gn         ON gn.id = s.groupname_id
LEFT JOIN list_affiliation aff      ON aff.id = s.affiliation_id
LEFT JOIN directory.lib_user sub    ON sub.userid = s.submit_userid
LEFT JOIN list_instructor li        ON li.id = s.instructor_id
LEFT JOIN directory.lib_user inst_user ON inst_user.userid = li.lib_user_id
LEFT JOIN list_department inst_dept ON inst_dept.id = li.department_id
LEFT JOIN list_requestor req        ON req.id = s.requestor_id
ORDER BY s.session_date;
```

**One row per instructor per session (via `instructor_2_statistics`):**

Sessions with no instructors still appear once with NULL instructor columns. Sessions with multiple instructors appear once per instructor.

```sql
SELECT
    s.id,
    s.session_date,
    s.submit_date,
    dept.name                   AS department_name,
    dept.code                   AS department_code,
    st.name                     AS session_type,
    cat.name                    AS category,
    t.name                      AS topic,
    s.topic_other,
    loc.name                    AS location,
    s.num_faculty,
    s.num_graduate,
    s.num_undergrad,
    s.num_staff,
    s.num_postdoc,
    s.num_professional,
    s.num_other,
    (COALESCE(s.num_faculty, 0) + COALESCE(s.num_graduate, 0) + COALESCE(s.num_undergrad, 0)
        + COALESCE(s.num_staff, 0) + COALESCE(s.num_postdoc, 0) + COALESCE(s.num_professional, 0)
        + COALESCE(s.num_other, 0)) AS total_participants,
    s.contact_hours,
    s.preparation_hours,
    COALESCE(gn.name, s.groupname, s.groupname_other) AS group_name,
    s.coursename,
    s.notes,
    s.dei_focus,
    aff.name                    AS affiliation,
    sub.lastname                AS submitted_by_lastname,
    sub.firstname               AS submitted_by_firstname,
    sub.username                AS submitted_by_username,
    sub.kerberos_id             AS submitted_by_kerberos_id,
    inst_user.lastname          AS instructor_lastname,
    inst_user.firstname         AS instructor_firstname,
    inst_user.username          AS instructor_username,
    inst_user.kerberos_id       AS instructor_kerberos_id,
    inst_dept.name              AS instructor_department,
    req.firstname               AS requestor_firstname,
    req.lastname                AS requestor_lastname,
    req.email                   AS requestor_email,
    req.dept                    AS requestor_dept
FROM statistics s
LEFT JOIN list_department dept      ON dept.id = s.department_id
LEFT JOIN list_session_type st      ON st.id = s.sessiontype_id
LEFT JOIN list_category cat         ON cat.id = s.category_id
LEFT JOIN list_topic t              ON t.id = s.topic_id
LEFT JOIN list_location loc         ON loc.id = s.location_id
LEFT JOIN list_groupname gn         ON gn.id = s.groupname_id
LEFT JOIN list_affiliation aff      ON aff.id = s.affiliation_id
LEFT JOIN directory.lib_user sub    ON sub.userid = s.submit_userid
LEFT JOIN instructor_2_statistics i2s ON i2s.statistics_id = s.id
LEFT JOIN list_instructor li        ON li.id = i2s.instructor_id
LEFT JOIN directory.lib_user inst_user ON inst_user.userid = li.lib_user_id
LEFT JOIN list_department inst_dept ON inst_dept.id = li.department_id
LEFT JOIN list_requestor req        ON req.id = s.requestor_id
ORDER BY s.session_date, inst_user.lastname;
```

### Research Consult Statistics
This can be exported from Qualtrics: https://ucdavis.co1.qualtrics.com/responses/#/surveys/SV_2bL0KnwiRNLvfUy. 

The file should be copied into `/services/archive/data`, and renamed according to property in `transform-research-metrics.js`. Run the script, and then copy to GCS.

## Importing Data

CSV exports from the legacy sources are stored in GCS at `gs://itis-backups/ucdlib-ref-stats/archive/`. The import script downloads only the CSVs that correspond to tables defined in `services/archive/schema.sql` and loads them into a separate `archive` database on the running Postgres instance.

### Schema

`services/archive/schema.sql` is the single source of truth for what gets imported. Each `CREATE TABLE` block:
- names the table (which must match the CSV filename without the `.csv` extension)
- defines the column names and types for that CSV

The schema uses `DROP TABLE IF EXISTS` before each `CREATE TABLE`, so re-running the import always starts from a clean slate.

### Running the import

```bash
./devops/cmds/import-archive-data.sh <environment>
# environment: local-dev or prod
```

Prerequisites: `gcloud` CLI authenticated to the `digital-ucdavis-edu` project (same requirement as the rest of the dev setup).

### Adding a new CSV

1. Export the legacy data as a CSV and upload it to `gs://itis-backups/ucdlib-ref-stats/archive/<table-name>.csv`
2. Add a `DROP TABLE IF EXISTS` + `CREATE TABLE` block to `schema.sql` with the matching table name and column types
3. Re-run the import script

