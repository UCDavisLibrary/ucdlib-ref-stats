#! /bin/bash
set -e

CMDS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
source "$CMDS_DIR/config.sh"

docker build \
  -t localhost/local-dev/ucdlib-ref-stats:local-dev \
  -f "${SERVICES_DIR}/Dockerfile" \
  ${ROOT_DIR}

docker build \
  -t localhost/local-dev/ucdlib-ref-stats-superset:local-dev \
  -f "${SERVICES_DIR}/superset/Dockerfile" \
  ${SERVICES_DIR}/superset