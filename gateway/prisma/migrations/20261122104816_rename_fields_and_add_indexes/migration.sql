-- CreateIndex
CREATE INDEX "ApiKey_KeyPrefix_idx" ON "ApiKey"("KeyPrefix");

-- CreateIndex
CREATE INDEX "ApiKey_customerId_idx" ON "ApiKey"("customerId");
