-- Add the two new Level values. Must be applied in its own transaction/migration:
-- Postgres does not allow a newly-added enum value to be used in the same
-- transaction that added it (see ADR-0009).
ALTER TYPE "Level" ADD VALUE 'SUPERUSER';
ALTER TYPE "Level" ADD VALUE 'PROJECT_MANAGER';
