# Library Services Statistics Application

Application for collecting and reporting library service statistics, such as librarian reference interactions.

## Architecture

The application is composed of several Docker services:

| Service | Description | Local port |
| ------- | ----------- | ---------- |
| `app` | Node.js/Express backend + Lit web component frontend | 3000 |
| `db` | PostgreSQL 17 | 5432 |
| `redis` | Cache for Superset | 6379 |
| `superset` | Apache Superset BI dashboards | 8088 |
| `backup` | Automated database backups to GCS (prod only) | — |
| `init` | Restores database from GCS backup (disabled by default) | — |
| `adminer` | Web-based database admin UI (dev only) | 8080 |

## Local Development

### Prerequisites

- Docker & Docker Compose
- `gcloud` CLI, authenticated to the `digital-ucdavis-edu` project

### First-time setup

```bash
./devops/cmds/init-local-dev.sh <branch-or-tag>
```

This builds the local Docker image, fetches the `.env` file from GCP Secret Manager, and downloads the GCP service account credentials needed to hydrate the database from a backup.

You will need to review and edit the `.env` file downloaded to `ucdlib-ref-stats-local-dev`, as it will have settings that only apply to the production instance.

### Running

```bash
cd devops/compose/ucdlib-ref-stats-local-dev
docker compose up
```

### Start App
By default, the application container is idle at `docker compose up`. Start the Express server with:

```bash
./devops/cmds/start-app.sh
```

### Frontend watch mode

Runs webpack inside the container (via volume mount) and hot-reloads on file changes:

```bash
./devops/cmds/watch-client.sh
```

## Authentication

Authentication is handled by Keycloak OIDC. Between the docker compose file and the `env`, all configuration is set.

- **Realm:** `https://auth.library.ucdavis.edu/realms/internal`
- The frontend obtains a JWT via `keycloak-js` and sends it as `Authorization: Bearer <token>` with each API request
- The server validates the token against the Keycloak userinfo endpoint and caches the response.

### Roles

Access is controlled by realm roles (`basic-access` and `admin-access`) and dedicated roles on the `ref-stats-client` Keycloak resource:

| Role | Access |
| ---- | ------ |
| `basic-access` | Log in to the application, and view their previous submissions. |
| `form--reference` / `form--instruction` / `form--outreach` | Submit the specific named form |
| `manager` | Admin access without any destructive actions |
| `admin-access` | Full admin access |

Department heads will also be able to view all the submissions for their employees, but this is not managed through a Keycloak role, but through the response from the UC Davis Library IAM API. Department head status is cached locally, which the user can refresh by logging out of the application if there have been changes to organizational data.

## Database Schema

Schema is initialized automatically from SQL files in `services/pg/schema/` on a fresh container.

Key tables and views:

| Object | Description |
| ------ | ----------- |
| `form`, `form_field`, `form_field_assignment` | Admin-managed form definitions |
| `picklist`, `picklist_item` | Dropdown options |
| `form_entry`, `form_entry_field_value` | Submitted reference interactions |
| `form_entry_full` | View joining entries with field values; primary source for Superset |
| `dashboard`, `dashboard_full` | Fact table/view for Superset dashboards that can be embedded in webapp|
| `users`, `groups` | Staff identity |
| `backup_log` | Database backup history |

## Superset

Superset is a data visualization tool that runs as a separate service sharing the same Postgres instance. In production it is mounted at `/dashboards` via an Apache reverse proxy.

### Roles

Superset uses its own role system, mapped from Keycloak at login. The Keycloak client is `ref-stats-superset`.

| Keycloak role | Superset role | Access |
| ------------- | ------------- | ------ |
| `admin-access` | Admin | Full admin |
| `refstats-superset-alpha` | Alpha | All data across all users |
| `basic-access` | Gamma | Own submissions only (row-level security) |

### Importing Assets

On a fresh install, a few assets should be imported to Superset, which can be found in `services/superset/exports/`.

The main dataset for dashboards is `dataset_main.zip`, which is the `form_entry_full` view (`postgres` database), which extracts specific field values as metrics (`event_count`, `person_count`, etc).

Then there are a few dashboards, which are prefixed with `dashboard`.

### Dataset Access

In order for a user to be able to view a dashboard, they need access to the underlying dataset(s). After a dataset is created, a new permission is created: `Dataset source access <source>`, which should be applied to the appropriate role (`Alpha`, `Gamma`).

### Row Level Security

By default, users can only see their own submissions. By setting up a "Row Level Security" (RLS) entry, this filter is automatically applied to all dashboards for the user:

| Field | Value |
| ----- | ----- |
| Filter Type | Base |
| Excluded Roles | Admin, Alpha |
| Clause | `submitted_by = '{{ current_username() }}'` |

### Embedded Dashboards

Superset dashboards can be embedded in the main web app using the `@superset-ui/embedded-sdk`. The flow is:

1. An admin creates a **Dashboard** record in the web app (at `/dashboard-admin`) and sets the `Superset Dashboard ID` field to the UUID of a Superset dashboard.
2. When an authenticated user visits `/analytics/:name`, the app server mints a signed **guest token** JWT and passes it to the embedded SDK.
3. The SDK renders the dashboard in an iframe pointed at Superset's `/embedded/{uuid}` endpoint.

#### Guest Token Signing

Rather than calling Superset's API for guest tokens (which requires CSRF handling), the app server self-signs the JWT using a shared secret. Both sides must share the same value:

| Env var | Where | Purpose |
| --- | --- | --- |
| `SUPERSET_GUEST_TOKEN_JWT_SECRET` | `app` + `superset` containers | Shared HMAC secret for signing/verifying guest tokens |
| `SUPERSET_PUBLIC_URL` | `app` container | Browser-accessible Superset URL used by the embedded SDK |

Superset must be configured to use the same audience string the app signs with:

```python
# superset_config.py
GUEST_TOKEN_JWT_AUDIENCE = "superset"   # must match `aud` claim in signed token
```

#### Required Superset Feature Flags

```python
FEATURE_FLAGS = {
    "EMBEDDED_SUPERSET": True,   # enables the /embedded endpoint and guest token validation
}
```

#### iframe Security Headers

Superset's Flask-Talisman middleware sets `X-Frame-Options: SAMEORIGIN` by default, which blocks iframe embedding. The fix is to override `TALISMAN_CONFIG` in `superset_config.py`, merging with Superset's defaults so that the full CSP is preserved and only `frame_options` is changed:

```python
from superset.config import TALISMAN_CONFIG as _talisman_defaults

_csp = dict(_talisman_defaults.get('content_security_policy', {}))
if _embedded_domain := os.environ.get('SUPERSET_EMBEDDED_DOMAIN', ''):
    _csp['frame-ancestors'] = ["'self'", _embedded_domain]

TALISMAN_CONFIG = {
    **_talisman_defaults,
    'content_security_policy': _csp,
    'frame_options': None,   # suppresses X-Frame-Options header
}
```

In production, set `SUPERSET_EMBEDDED_DOMAIN` (e.g. `https://statistics.staff.library.ucdavis.edu`) to add a `frame-ancestors` CSP directive restricting which origins can embed Superset. **If this variable is not set, there is no `frame-ancestors` restriction and any site can iframe Superset.**

#### Guest Role Permissions

Superset makes all embed requests from a single `GUEST` psuedo user. Superset's default `GUEST_ROLE_NAME` is `Public`, which has no permissions. Set the role with:

```python
GUEST_ROLE_NAME = "Alpha"  
```

We use `Alpha` instead of `Gamma` because our `Gamma` has an rls rule that limits returned rows to only the current user's submissions.

#### Row-Level Security in Embedded Context
Unfortunately, the RLS rules set in the Superset UI cannot be reused when embedding since the `GUEST` user can only have one role, which cannot be temporarily adjusted to match the role of the user making the embedding request.

However, the embedded sdk lets you pass in arbitrary rls rules in the jwt token. In the webapp's dashboard form, an admin can generate an rls rule based on select fields from the current user's keycloak token (email, username, realm and client roles). Then, when a guest token is issued, the app server evaluates this config against the user's Keycloak roles and injects RLS clauses directly into the token payload. 

There should be an RLS for most dashboards that mirrors the RLS rule established in Superset (see above) - `submitted_by = ${kc_username}` where user does not have roles `admin-access` or `refstats-superset-alpha`

## Production

### Build and deploy

First check in and tag code. e.g. `git tag v1.1.0`. Make sure to update `ucdlib-ref-stats-prod/compose.yaml` with the new image version.

```bash
# Build images
./devops/cmds/build.sh <tag>
```

Ssh onto the VM, and pull the new image:

```bash
cd devops/compose/ucdlib-ref-stats-prod
docker compose pull
```

And then restart the services. There will be a brief outage.
```bash
docker compose down
docker compose up -d
```

### Backup and restore

Automated daily backups run via the `backup` service and are written to the GCS bucket `itis-backups/ucdlib-ref-stats`.

To restore from the latest backup, drop volumes, and set `RUN_INIT: true` in the `init` service.
