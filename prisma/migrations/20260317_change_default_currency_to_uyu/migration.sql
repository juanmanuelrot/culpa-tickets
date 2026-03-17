-- AlterTable: Change default currency from ARS to UYU
ALTER TABLE "TicketType" ALTER COLUMN "currency" SET DEFAULT 'UYU';
