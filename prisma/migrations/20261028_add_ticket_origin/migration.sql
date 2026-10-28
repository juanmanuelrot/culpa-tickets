-- CreateEnum
CREATE TYPE "TicketOrigin" AS ENUM ('ONLINE', 'OFFLINE_PAID', 'COURTESY');

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "chargedInCents" INTEGER,
ADD COLUMN     "faceValueInCents" INTEGER,
ADD COLUMN     "issuedById" TEXT,
ADD COLUMN     "origin" "TicketOrigin" NOT NULL DEFAULT 'ONLINE';

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: todo lo emitido hasta hoy por link o por QR directo fue cortesía.
-- El checkout siempre pide documento, así que sin documento es un QR directo.
-- Valen el precio actual de su tipo de entrada; quien creó el link queda como
-- emisor, los QR directos no guardaban quién los hizo y quedan sin asignar.
UPDATE "Ticket" t
SET "origin" = 'COURTESY',
    "chargedInCents" = 0,
    "faceValueInCents" = tt."price",
    "issuedById" = u."id"
FROM "TicketType" tt, "Ticket" src
LEFT JOIN "FreeInviteLink" l ON l."id" = src."freeInviteLinkId"
LEFT JOIN "User" u ON u."id" = l."createdBy"
WHERE tt."id" = t."ticketTypeId"
  AND src."id" = t."id"
  AND (t."freeInviteLinkId" IS NOT NULL OR t."purchaserGovId" IS NULL);

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_freeInviteLinkId_fkey";

-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "freeInviteLinkId";

-- DropTable
DROP TABLE "FreeInviteLink";
