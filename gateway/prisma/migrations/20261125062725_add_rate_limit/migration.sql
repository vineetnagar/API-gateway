-- AlterTable
ALTER TABLE "ApiKey" ADD COLUMN     "rateLimitPerMinute" INTEGER NOT NULL DEFAULT 5;
