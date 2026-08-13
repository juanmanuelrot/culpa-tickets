import type { TicketStatus } from "@/generated/prisma/enums";

// Tickets that actually count towards metrics: real payments plus invitations
// (free invite links and admin-issued QRs are created straight as PAID).
// Leaves out PENDING_PAYMENT (abandoned/incomplete checkouts) and CANCELLED.
export const CONFIRMED_TICKET_STATUSES: TicketStatus[] = ["PAID", "USED"];

export const confirmedTicketsWhere = {
  status: { in: CONFIRMED_TICKET_STATUSES },
};
