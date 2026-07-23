#! /bin/bash

###
# Runs a SQL file against the Postgres container in the specified environment.
#
# Usage: ./devops/cmds/run-sql.sh <sql-file> <environment> [--db <database>]
#   sql-file:    path to the .sql file to execute
#   environment: local-dev or prod
#   --db:        target database (default: postgres)
###

set -e
CMDS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
source "$CMDS_DIR/config.sh"

SQL_FILE=$1
ENV=$2
DB="postgres"

# parse --db flag from remaining args
shift 2 || true
while [[ $# -gt 0 ]]; do
  case $1 in
    --db) DB="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [ -z "$SQL_FILE" ] || [ -z "$ENV" ]; then
  echo "Usage: run-sql.sh <sql-file> <environment> [--db <database>]"
  exit 1
fi

if [ ! -f "$SQL_FILE" ]; then
  echo "SQL file not found: $SQL_FILE"
  exit 1
fi

# Resolve to absolute path before cd changes the working directory
SQL_FILE=$(cd "$(dirname "$SQL_FILE")" && pwd)/$(basename "$SQL_FILE")

DEPLOY_DIR="$COMPOSE_DIR/$PROJECT_NAME-$ENV"
if [ ! -d "$DEPLOY_DIR" ]; then
  echo "Deploy directory not found: $DEPLOY_DIR"
  exit 1
fi

cd "$DEPLOY_DIR"
echo "Running $SQL_FILE against database '$DB' ($ENV)..."
cat "$SQL_FILE" | docker compose exec -T db psql -U postgres -d "$DB"
echo "Done."
