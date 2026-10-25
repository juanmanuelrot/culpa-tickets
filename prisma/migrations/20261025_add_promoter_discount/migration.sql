-- AlterTable
ALTER TABLE "Promoter" ADD COLUMN "discountPercent" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN "discountInCents" INTEGER NOT NULL DEFAULT 0;
