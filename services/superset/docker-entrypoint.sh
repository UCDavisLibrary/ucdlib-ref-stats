#!/bin/bash
set -e
superset db upgrade
superset init
exec gunicorn --bind 0.0.0.0:8088 --workers 4 --timeout 120 "superset.app:create_app()"
