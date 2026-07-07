FROM node:26

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
RUN apt-get update && apt-get install -y --no-install-recommends \
  postgresql-client \
  wait-for-it \
  google-cloud-sdk \
  && rm -rf /var/lib/apt/lists/*

# Set working directory
RUN mkdir /services
WORKDIR /services

# Backup
RUN mkdir utils-data && mkdir utils-data/backup
COPY services/backup ./backup
COPY services/backup/cron /etc/cron.d/backup
RUN chmod 0644 /etc/cron.d/backup

# Init
RUN mkdir utils-data/init
COPY services/init ./init


# Install app dependencies
COPY services/package.json .
COPY services/package-lock.json .
RUN npm install

# Copy app source code
COPY services/lib ./lib
COPY services/pg ./pg
COPY services/client ./client

# Build the client
RUN npm run client-build-dist

CMD ["bash", "-c", "tail -f /dev/null"]