-- AlterTable: admin-issued QR invites may have no email address
ALTER TABLE "Ticket" ALTER COLUMN "purchaserEmail" DROP NOT NULL;
