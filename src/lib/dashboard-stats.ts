import { CONFIRMED_TICKET_STATUSES } from "@/lib/tickets";

// Las métricas del panel miran solo lo que está en la calle hoy: un evento
// apagado (isActive false) no suma ni en el conteo de eventos ni con sus
// tickets. La lista de espera queda aparte, es global y no cuelga de un evento.

export interface DashboardStats {
  events: number;
  whitelisted: number;
  tickets: number;
  paidTickets: number;
  usedTickets: number;
}

interface EventFlag {
  isActive: boolean;
}

interface TicketRow {
  status: string;
  event: EventFlag;
}

interface StatsInput {
  events: EventFlag[] | undefined;
  tickets: TicketRow[] | undefined;
  whitelistTotal: number | undefined;
}

const CONFIRMED: string[] = CONFIRMED_TICKET_STATUSES;

export function summarizeStats({
  events,
  tickets,
  whitelistTotal,
}: StatsInput): DashboardStats {
  const activeEvents = (Array.isArray(events) ? events : []).filter(
    (event) => event.isActive
  );

  const confirmed = (Array.isArray(tickets) ? tickets : []).filter(
    (ticket) => ticket.event?.isActive && CONFIRMED.includes(ticket.status)
  );

  const paidTickets = confirmed.filter((t) => t.status === "PAID").length;
  const usedTickets = confirmed.filter((t) => t.status === "USED").length;

  return {
    events: activeEvents.length,
    whitelisted: whitelistTotal || 0,
    tickets: paidTickets + usedTickets,
    paidTickets,
    usedTickets,
  };
}
