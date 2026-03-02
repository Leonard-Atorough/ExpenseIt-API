-- AlterTable Account - Add updatedAt field and set defaults
ALTER TABLE "Account" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Account" ALTER COLUMN "dateCreated" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable Transaction - Set defaults and change dateModified to use updatedAt
ALTER TABLE "Transaction" ALTER COLUMN "dateCreated" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Transaction" ADD COLUMN "dateModifiedNew" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "Transaction" SET "dateModifiedNew" = "dateModified" WHERE "dateModified" IS NOT NULL;
ALTER TABLE "Transaction" DROP COLUMN "dateModified";
ALTER TABLE "Transaction" RENAME COLUMN "dateModifiedNew" TO "dateModified";

-- AlterTable ActivationToken - Set default for createdAt
ALTER TABLE "ActivationToken" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable RefreshToken - Set default for createdAt
ALTER TABLE "RefreshToken" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
