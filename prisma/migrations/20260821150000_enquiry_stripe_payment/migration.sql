-- AlterTable
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "paymentLinkUrl" TEXT;
ALTER TABLE "Enquiry" ADD COLUMN IF NOT EXISTS "stripeCheckoutSessionId" TEXT;
