FROM node:22

RUN apt-get update && apt-get install -y \
  apt-transport-https \
  ca-certificates \
  gnupg \
  curl \
  cron \
  lsb-release \
  vim \
  procps

# Prep work for gsutil
RUN install -d -m 0755 /etc/apt/keyrings \
 && curl -fsSL https://packages.cloud.google.com/apt/doc/apt-key.gpg \
  | gpg --dearmor -o /etc/apt/keyrings/cloud.google.gpg \
 && chmod 0644 /etc/apt/keyrings/cloud.google.gpg
RUN echo "deb [signed-by=/etc/apt/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" \
  > /etc/apt/sources.list.d/google-cloud-sdk.list

# prep for postgres
RUN install -d -m 0755 /etc/apt/keyrings \
 && curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
    | gpg --dearmor -o /etc/apt/keyrings/postgresql.gpg \
 && chmod 0644 /etc/apt/keyrings/postgresql.gpg
RUN echo "deb [signed-by=/etc/apt/keyrings/postgresql.gpg] \
  http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" \
  > /etc/apt/sources.list.d/pgdg.list

# Set up init/backup utils
RUN apt-get update && apt-get install -y \
  postgresql-client \
  wait-for-it \
  google-cloud-sdk
RUN mkdir -p deploy-utils/data
WORKDIR /app/deploy-utils

# Set working directory
RUN mkdir /services
WORKDIR /services

# Install app dependencies
COPY services/package.json .
COPY services/package-lock.json .
RUN npm install

# Copy app source code
# COPY services/lib ./lib
COPY services/pg ./pg
COPY services/client ./client

# Build the client
# RUN npm run client-build-dist && npm run client-build-dev

CMD ["bash", "-c", "tail -f /dev/null"]