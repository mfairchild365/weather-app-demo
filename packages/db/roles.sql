-- Least-privilege database roles (constitution Principle III: the public surface is read-only).
--
-- This file is the canonical, human-readable reference for the grants below and can be run
-- manually against a database with:
--   psql -v ingest_password="$WEATHER_INGEST_PASSWORD" -v api_password="$WEATHER_API_PASSWORD" \
--        -f roles.sql
-- (variable substitution requires -f; it is not applied when piped via stdin or -c).
--
-- The automated path used by docker/Dockerfile.migrate and the test suite is
-- src/apply-roles.ts, which executes the same statements through the pg client directly — no
-- psql dependency in the container image, and directly unit-testable. Keep the two in sync.
--
-- Idempotent: safe to run against a database where these roles already exist.

-- psql's :'var' substitution does not reach inside dollar-quoted (DO $$ ... $$) bodies, so role
-- creation is done as plain statements instead of a PL/pgSQL block: try CREATE (ignoring the
-- "already exists" error), then unconditionally ALTER the password. Both branches leave the role
-- present with the current password, which is what makes this idempotent.
\set ON_ERROR_STOP off
CREATE ROLE weather_ingest LOGIN;
CREATE ROLE weather_api LOGIN;
\set ON_ERROR_STOP on

ALTER ROLE weather_ingest LOGIN PASSWORD :'ingest_password';
ALTER ROLE weather_api LOGIN PASSWORD :'api_password';

GRANT CONNECT ON DATABASE weather_demo TO weather_ingest, weather_api;
GRANT USAGE ON SCHEMA public TO weather_ingest, weather_api;

-- weather_api: SELECT only, on every table that exists now and every table created hereafter.
GRANT SELECT ON ALL TABLES IN SCHEMA public TO weather_api;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO weather_api;

-- weather_ingest: read everything (needs cities/providers/lookups to build upserts), but may only
-- write to the tables the ingestion job actually populates.
GRANT SELECT ON ALL TABLES IN SCHEMA public TO weather_ingest;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO weather_ingest;

GRANT INSERT, UPDATE ON ingest_runs, observations, forecast_hourly, forecast_daily TO weather_ingest;
GRANT USAGE, SELECT ON SEQUENCE ingest_runs_id_seq TO weather_ingest;
GRANT USAGE, SELECT ON SEQUENCE observations_id_seq TO weather_ingest;
GRANT USAGE, SELECT ON SEQUENCE forecast_hourly_id_seq TO weather_ingest;
GRANT USAGE, SELECT ON SEQUENCE forecast_daily_id_seq TO weather_ingest;

-- Neither role gets DELETE, DDL, or ownership on anything — only weather_owner (the migration
-- connection) can alter schema or delete rows.
