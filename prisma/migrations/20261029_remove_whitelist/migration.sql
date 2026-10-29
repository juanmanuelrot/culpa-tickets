-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_whitelistedPersonId_fkey";

-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "whitelistedPersonId";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "isPublic";

-- DropTable
DROP TABLE "WhitelistedPersonTicketType";

-- DropTable
DROP TABLE "WhitelistedPerson";
