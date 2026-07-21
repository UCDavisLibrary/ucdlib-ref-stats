#! /bin/bash

###
# Imports legacy statistics CSVs from GCS into a separate 'archive'
# database on the running Postgres instance. Tables to import and their column
# definitions are declared in services/archive/schema.sql. Only CSV files that
# correspond to a table in schema.sql are downloaded and imported.
#
# Usage: ./devops/cmds/import-archive-data.sh <environment>
#   environment: local-dev or prod
###

set -e
CMDS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
source "$CMDS_DIR/config.sh"

ENV=$1
if [ -z "$ENV" ]; then
  echo "Usage: import-archive-data.sh <environment>"
  echo "  environment: local-dev or prod"
  exit 1
fi

DEPLOY_DIR="$COMPOSE_DIR/$PROJECT_NAME-$ENV"

if [ ! -d "$DEPLOY_DIR" ]; then
  echo "Deploy directory not found: $DEPLOY_DIR"
  exit 1
fi

SCHEMA_FILE="$SERVICES_DIR/archive/schema.sql"
GCS_PATH="gs://itis-backups/ucdlib-ref-stats/archive"
ARCHIVE_DB="archive"
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Derive expected table names from schema.sql CREATE TABLE statements
expected_tables=$(awk '/CREATE TABLE/ {print $3}' "$SCHEMA_FILE")

if [ -z "$expected_tables" ]; then
  echo "No CREATE TABLE statements found in $SCHEMA_FILE"
  exit 1
fi

echo "Tables defined in schema: $(echo $expected_tables | tr '\n' ' ')"

cd "$DEPLOY_DIR"

# Create archive database if it does not already exist
if ! docker compose exec -T db psql -U postgres -tAc \
    "SELECT 1 FROM pg_database WHERE datname='$ARCHIVE_DB'" | grep -q 1; then
  echo "Creating '$ARCHIVE_DB' database..."
  docker compose exec db psql -U postgres -c "CREATE DATABASE $ARCHIVE_DB;"
fi

# Apply schema — drops and recreates all defined tables with proper column types
echo "Applying schema from $SCHEMA_FILE..."
cat "$SCHEMA_FILE" | docker compose exec -T db psql -U postgres -d "$ARCHIVE_DB"

# Download each defined CSV from GCS and import it
for table in $expected_tables; do
  gcs_file="$GCS_PATH/${table}.csv"
  local_file="$TEMP_DIR/${table}.csv"

  echo "Downloading $gcs_file..."
  gsutil cp "$gcs_file" "$local_file"

  echo "Importing into table '$table'..."
  cat "$local_file" | docker compose exec -T db \
    psql -U postgres -d "$ARCHIVE_DB" -c "\copy $table FROM STDIN CSV HEADER NULL 'NULL'"

  echo "  Done."
done

echo "Import complete. Database: '$ARCHIVE_DB'"
