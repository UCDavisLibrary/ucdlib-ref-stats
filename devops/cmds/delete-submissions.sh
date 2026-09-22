#! /bin/bash

###
# Permanently deletes all form submissions (form_entry and their form_entry_field_value
# rows) in the specified environment, via TRUNCATE ... CASCADE. Form/dashboard configuration
# is not affected. Intended for clearing out test submissions before going to production.
#
# Usage: ./devops/cmds/delete-submissions.sh <environment>
#   environment: local-dev or prod
###

set -e
CMDS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
source "$CMDS_DIR/config.sh"

ENV=$1
if [ -z "$ENV" ]; then
  echo "Usage: delete-submissions.sh <environment>"
  echo "  environment: local-dev or prod"
  exit 1
fi

DEPLOY_DIR="$COMPOSE_DIR/$PROJECT_NAME-$ENV"
if [ ! -d "$DEPLOY_DIR" ]; then
  echo "Deploy directory not found: $DEPLOY_DIR"
  exit 1
fi

cd "$DEPLOY_DIR"

COUNT=$(docker compose exec -T db psql -U postgres -d postgres -tAc "SELECT COUNT(*) FROM form_entry;")

if [ "$COUNT" -eq 0 ]; then
  echo "No form submissions found in '$ENV'. Nothing to do."
  exit 0
fi

echo "This will PERMANENTLY delete all $COUNT form submission(s) in the '$ENV' environment."
echo "Form and dashboard configuration will NOT be affected."
read -p "Type the environment name ('$ENV') to confirm: " CONFIRM

if [ "$CONFIRM" != "$ENV" ]; then
  echo "Confirmation did not match. Aborting."
  exit 1
fi

echo "Deleting all form submissions in '$ENV'..."
docker compose exec -T db psql -U postgres -d postgres -c "TRUNCATE form_entry CASCADE;"
echo "Done."
