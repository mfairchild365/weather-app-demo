#!/bin/sh
# One-shot setup run by the `migrate` compose service (docker-compose.yml): apply pending
# migrations, then roles/grants, then the starter-city seed, in that order, then exit. Every step
# here is idempotent (see packages/db/src/{migrate,apply-roles,seed}.ts), so re-running this
# container against an already-provisioned database is safe.
set -e

echo "==> Applying migrations"
npx tsx packages/db/src/migrate.ts

echo "==> Applying roles and grants"
npx tsx packages/db/src/apply-roles.ts

echo "==> Seeding starter data"
npx tsx packages/db/src/seed.ts

echo "==> Platform foundation ready"
