#!/bin/bash
set -e
superset db upgrade

if [ -n "${SUPERSET_ADMIN_USERNAME}" ] && [ -n "${SUPERSET_ADMIN_PASSWORD}" ]; then
  superset fab create-admin \
    --username "${SUPERSET_ADMIN_USERNAME}" \
    --firstname "Service" \
    --lastname "Account" \
    --email "${SUPERSET_ADMIN_EMAIL:-svc@localhost}" \
    --password "${SUPERSET_ADMIN_PASSWORD}" || true
fi

superset init
exec gunicorn --bind 0.0.0.0:8088 --workers 4 --timeout 120 "superset.app:create_app()"
