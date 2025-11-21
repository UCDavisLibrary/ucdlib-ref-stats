#! /bin/bash

###
# Does all the setup required for local development
###

set -e
CMDS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
source "$CMDS_DIR/config.sh"

cd $CMDS_DIR

echo "Building local-dev docker image..."
./build-local-dev.sh
echo "Local-dev docker image built."

echo "Fetching .env for local-dev if not present..."
./get-env.sh local-dev
echo ".env fetch complete. Remember to update .env to match your local setup."