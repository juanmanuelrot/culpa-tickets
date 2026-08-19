import type { TicketStatus } from "@/generated/prisma/enums";

// Tickets that actually count towards metrics: real payments plus invitations
// (free invite links and admin-issued QRs are created straight as PAID).
// Leaves out PENDING_PAYMENT (abandoned/incomplete checkouts) and CANCELLED.
export const CONFIRMED_TICKET_STATUSES: TicketStatus[] = ["PAID", "USED"];

export const confirmedTicketsWhere = {
  status: { in: CONFIRMED_TICKET_STATUSES },
};

// Invitations: tickets the house handed out instead of selling — redeemed free
// invite links and admin-issued direct QRs. Neither goes through checkout, and
// checkout always demands a gov ID, so a missing one marks a direct QR.
export const invitationTicketsWhere = {
  OR: [{ freeInviteLinkId: { not: null } }, { purchaserGovId: null }],
};

// Confirmed tickets that were actually bought: everything the two invitation
// paths above don't cover. Kept as the complement so sold + invitations always
// add up to confirmedTicketsWhere.
export const soldTicketsWhere = {
  ...confirmedTicketsWhere,
  freeInviteLinkId: null,
  purchaserGovId: { not: null },
};

export const confirmedInvitationsWhere = {
  ...confirmedTicketsWhere,
  ...invitationTicketsWhere,
};
