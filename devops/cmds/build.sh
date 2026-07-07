#! /bin/bash

###
# Main build process to cutting production images
###

set -e

CMDS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
source "$CMDS_DIR/config.sh"

VERSION=$1
if [ -z "$VERSION" ]; then
  echo "Please provide a version number"
  exit 1
fi

cork-kube build gcb \
  --project $PROJECT_NAME \
  --version $VERSION \
  --depth ALL
