-- Rename RoleTag.DIRECTOR to DEVELOPER (see ADR-0010). No existing rows use
-- DIRECTOR (verified via direct query before writing this migration), so this
-- is a single-step enum recreation - no data UPDATE needed first, unlike
-- ADR-0009's Level migration.
ALTER TYPE "RoleTag" RENAME TO "RoleTag_old";
CREATE TYPE "RoleTag" AS ENUM ('DEVELOPER', 'VENTAS', 'COPYWRITING', 'PUBLICISTA', 'DISENADOR', 'FILMMAKER', 'EDITOR_VIDEO', 'COMMUNITY_MANAGER', 'TRAFIKER', 'ECOMMERCE');

ALTER TABLE "User" ALTER COLUMN "roleTag" TYPE "RoleTag" USING ("roleTag"::text::"RoleTag");
ALTER TABLE "Task" ALTER COLUMN "roleTag" TYPE "RoleTag" USING ("roleTag"::text::"RoleTag");

DROP TYPE "RoleTag_old";
