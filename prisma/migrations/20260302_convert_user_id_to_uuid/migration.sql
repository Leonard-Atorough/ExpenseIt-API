-- AlterTable - Drop constraints and foreign keys from dependent tables
ALTER TABLE "ActivationToken" DROP CONSTRAINT "ActivationToken_userId_fkey";
ALTER TABLE "Account" DROP CONSTRAINT "Account_userId_fkey";
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_userId_fkey";
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_userId_fkey";

-- ActivationToken: Convert userId from INT to TEXT
ALTER TABLE "ActivationToken" ALTER COLUMN "userId" SET DATA TYPE TEXT USING "userId"::text;

-- Account: Convert userId from INT to TEXT and id from SERIAL to TEXT
ALTER TABLE "Account" DROP CONSTRAINT "Account_pkey";
ALTER TABLE "Account" ALTER COLUMN "id" SET DATA TYPE TEXT;
ALTER TABLE "Account" ALTER COLUMN "userId" SET DATA TYPE TEXT USING "userId"::text;
ALTER TABLE "Account" ADD CONSTRAINT "Account_pkey" PRIMARY KEY ("id");

-- Transaction: Convert id and userId from INT to TEXT
ALTER TABLE "Transaction" ALTER COLUMN "id" SET DATA TYPE TEXT;
ALTER TABLE "Transaction" ALTER COLUMN "userId" SET DATA TYPE TEXT USING "userId"::text;

-- RefreshToken: Convert userId from INT to TEXT
ALTER TABLE "RefreshToken" ALTER COLUMN "userId" SET DATA TYPE TEXT USING "userId"::text;

-- User: Convert id from SERIAL to TEXT with UUID default
ALTER TABLE "User" DROP CONSTRAINT "User_pkey";
ALTER TABLE "User" ALTER COLUMN "id" SET DATA TYPE TEXT;
ALTER TABLE "User" ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- Re-add foreign key constraints
ALTER TABLE "ActivationToken" ADD CONSTRAINT "ActivationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
