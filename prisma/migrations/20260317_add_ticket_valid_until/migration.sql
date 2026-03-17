-- AlterTable
ALTER TABLE "TicketType" ADD COLUMN "validUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN "validUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "FreeInviteLink" ADD COLUMN "ticketValidUntil" TIMESTAMP(3);
