ARG SUPERSET_VERSION=6.1.0
FROM apache/superset:${SUPERSET_VERSION}
ARG SUPERSET_VERSION
USER root
RUN uv pip install --python /app/.venv --no-cache "apache-superset[postgres,oauth]==${SUPERSET_VERSION}" authlib
COPY superset_config.py /app/pythonpath/superset_config.py
COPY templates/tail_js_custom_extra.html /app/superset/templates/tail_js_custom_extra.html
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh
USER superset
CMD ["/app/docker-entrypoint.sh"]
