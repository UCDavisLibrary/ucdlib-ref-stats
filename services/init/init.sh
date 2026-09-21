#! /bin/bash
set -eo pipefail

trap 'echo "Init container is finished and exiting (this is supposed to happen)"' EXIT

DATA_DIR=/services/utils-data/init

# wait for db to start up
echo "Waiting for db to start up"
wait-for-it $PGHOST:$PGPORT -t 0

if [[ -z "$RUN_INIT" || -z "$INIT_DATA_ENV" ]]; then
  echo "Skipping db hydration.";
  if [[ -z "$RUN_INIT" ]]; then
    echo "No RUN_INIT flag found."
    exit 0
  else 
    echo "INIT_DATA_ENV environmental variable is not set."
    exit 0
  fi
fi

if [[ ! -f "$GOOGLE_APPLICATION_CREDENTIALS" ]]; then
  echo "Google cloud credential key file doesn't exist"
  exit 0
fi

# check that postgres has tables
echo "Checking if db has tables"
DB_HAS_DATA=$(echo "SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'form');" | psql -t | xargs)
if [[ $DB_HAS_DATA == 'f' ]]; then
  echo "No data found in db, attempting to pull content for google cloud bucket"
  gcloud auth login --quiet --cred-file=${GOOGLE_APPLICATION_CREDENTIALS}

  echo "Downloading: gs://${GC_BACKUP_BUCKET}/${INIT_DATA_ENV}/${BACKUP_FILE_NAME}"
  gsutil cp "gs://${GC_BACKUP_BUCKET}/${INIT_DATA_ENV}/${BACKUP_FILE_NAME}" $DATA_DIR/$BACKUP_FILE_NAME
  echo "hydrating db from sqldump"
  gunzip -c $DATA_DIR/$BACKUP_FILE_NAME | psql
  rm $DATA_DIR/$BACKUP_FILE_NAME

  # superset's own database dump was made with pg_dump --create, so it contains its own
  # DROP DATABASE IF EXISTS / CREATE DATABASE / \connect superset statements - restoring it
  # against the default (postgres) connection is what makes that self-sufficient.
  echo "Downloading: gs://${GC_BACKUP_BUCKET}/${INIT_DATA_ENV}/${SUPERSET_BACKUP_FILE_NAME}"
  gsutil cp "gs://${GC_BACKUP_BUCKET}/${INIT_DATA_ENV}/${SUPERSET_BACKUP_FILE_NAME}" $DATA_DIR/$SUPERSET_BACKUP_FILE_NAME
  echo "hydrating superset db from sqldump"
  gunzip -c $DATA_DIR/$SUPERSET_BACKUP_FILE_NAME | psql
  rm $DATA_DIR/$SUPERSET_BACKUP_FILE_NAME

  echo "db hydration complete"
else
  echo "Tables found in db. Skipping hydration."
fi
