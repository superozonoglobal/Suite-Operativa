-- Move any existing DIRECTOR users to SUPERUSER (see ADR-0009), then drop
-- DIRECTOR from the Level enum. Postgres has no direct "DROP VALUE" for enum
-- types, so we recreate the type without it and cast the column across.
UPDATE "User" SET "level" = 'SUPERUSER' WHERE "level" = 'DIRECTOR';

ALTER TYPE "Level" RENAME TO "Level_old";
CREATE TYPE "Level" AS ENUM ('SUPERUSER', 'PROJECT_MANAGER', 'LIDER', 'COLABORADOR');
ALTER TABLE "User" ALTER COLUMN "level" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "level" TYPE "Level" USING ("level"::text::"Level");
ALTER TABLE "User" ALTER COLUMN "level" SET DEFAULT 'COLABORADOR';
DROP TYPE "Level_old";
