/*
  Warnings:

  - You are about to drop the column `KeyHash` on the `ApiKey` table. All the data in the column will be lost.
  - You are about to drop the column `KeyPrefix` on the `ApiKey` table. All the data in the column will be lost.
  - You are about to drop the column `allowedPath` on the `ApiKey` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[keyHash]` on the table `ApiKey` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `keyHash` to the `ApiKey` table without a default value. This is not possible if the table is not empty.
  - Added the required column `keyPrefix` to the `ApiKey` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ApiKey_KeyHash_key";

-- DropIndex
DROP INDEX "ApiKey_KeyPrefix_idx";

-- AlterTable
ALTER TABLE "ApiKey" DROP COLUMN "KeyHash",
DROP COLUMN "KeyPrefix",
DROP COLUMN "allowedPath",
ADD COLUMN     "allowedPaths" TEXT[],
ADD COLUMN     "keyHash" TEXT NOT NULL,
ADD COLUMN     "keyPrefix" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_keyPrefix_idx" ON "ApiKey"("keyPrefix");
