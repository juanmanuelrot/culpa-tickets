import type { TicketStatus } from "@/generated/prisma/enums";

// Tickets that actually count towards metrics: real payments plus the ones
// issued from "Generar QR" (created straight as PAID).
// Leaves out PENDING_PAYMENT (abandoned/incomplete checkouts) and CANCELLED.
export const CONFIRMED_TICKET_STATUSES: TicketStatus[] = ["PAID", "USED"];

export const confirmedTicketsWhere = {
  status: { in: CONFIRMED_TICKET_STATUSES },
};

// Confirmed tickets bought on the site. What came out of "Generar QR"
// (courtesies and offline payments) is counted on its own.
export const soldTicketsWhere = {
  ...confirmedTicketsWhere,
  origin: "ONLINE" as const,
};
