-- AlterTable User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totpSecret" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totpEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "failedLoginCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);

-- AlterTable Enquiry
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Enquiry_idempotencyKey_key" ON "Enquiry"("idempotencyKey");

-- AuditLog indexes
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateTable StockWaitlist
CREATE TABLE IF NOT EXISTS "StockWaitlist" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockWaitlist_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "StockWaitlist_productId_notifiedAt_idx" ON "StockWaitlist"("productId", "notifiedAt");
CREATE INDEX IF NOT EXISTS "StockWaitlist_phone_idx" ON "StockWaitlist"("phone");

ALTER TABLE "StockWaitlist" DROP CONSTRAINT IF EXISTS "StockWaitlist_productId_fkey";
ALTER TABLE "StockWaitlist" ADD CONSTRAINT "StockWaitlist_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable PrivacyRequest
CREATE TABLE IF NOT EXISTS "PrivacyRequest" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "PrivacyRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PrivacyRequest_status_createdAt_idx" ON "PrivacyRequest"("status", "createdAt");
