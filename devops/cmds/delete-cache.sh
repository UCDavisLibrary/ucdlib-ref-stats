#! /bin/bash

###
# Deletes rows from the 'cache' table by type, or by type+query, with a confirmation prompt.
#
# Usage: ./devops/cmds/delete-cache.sh <environment> <type> [--query <query>]
#   environment: local-dev or prod
#   type:        cache 'type' column value (e.g. 'libraryIamUser', 'accessToken')
#   --query:     optional cache 'query' column value — if given, only the row(s) matching
#                both type and query are deleted; if omitted, all rows for that type are deleted
###

set -e
CMDS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
source "$CMDS_DIR/config.sh"

ENV=$1
TYPE=$2
QUERY=""

shift 2 || true
while [[ $# -gt 0 ]]; do
  case $1 in
    --query) QUERY="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [ -z "$ENV" ] || [ -z "$TYPE" ]; then
  echo "Usage: delete-cache.sh <environment> <type> [--query <query>]"
  echo "  environment: local-dev or prod"
  echo "  type:        cache 'type' column value"
  echo "  --query:     optional cache 'query' column value"
  exit 1
fi

DEPLOY_DIR="$COMPOSE_DIR/$PROJECT_NAME-$ENV"
if [ ! -d "$DEPLOY_DIR" ]; then
  echo "Deploy directory not found: $DEPLOY_DIR"
  exit 1
fi

cd "$DEPLOY_DIR"

WHERE_SQL="type = :'type'"
if [ -n "$QUERY" ]; then
  WHERE_SQL="$WHERE_SQL AND query = :'query'"
fi

COUNT=$(echo "SELECT COUNT(*) FROM cache WHERE $WHERE_SQL;" | \
  docker compose exec -T db psql -U postgres -d postgres -v type="$TYPE" -v query="$QUERY" -tA)

if [ "$COUNT" -eq 0 ]; then
  echo "No cache rows found for type '$TYPE'$( [ -n "$QUERY" ] && echo " and query '$QUERY'" ) in '$ENV'. Nothing to do."
  exit 0
fi

echo "This will PERMANENTLY delete $COUNT cache row(s) for type '$TYPE'$( [ -n "$QUERY" ] && echo " and query '$QUERY'" ) in the '$ENV' environment."
read -p "Type the environment name ('$ENV') to confirm: " CONFIRM

if [ "$CONFIRM" != "$ENV" ]; then
  echo "Confirmation did not match. Aborting."
  exit 1
fi

echo "Deleting cache row(s) in '$ENV'..."
echo "DELETE FROM cache WHERE $WHERE_SQL;" | \
  docker compose exec -T db psql -U postgres -d postgres -v type="$TYPE" -v query="$QUERY"
echo "Done."
