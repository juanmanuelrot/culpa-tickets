import { CONFIRMED_TICKET_STATUSES } from "@/lib/tickets";

// Las métricas del panel miran solo lo que está en la calle hoy: un evento
// apagado (isActive false) no suma ni en el conteo de eventos ni con sus
// tickets. La lista de espera queda aparte, es global y no cuelga de un evento.
//
// La plata va en centavos: lo online a precio de entrada menos el descuento del
// RRPP, lo pago por fuera por lo que se cobró, y las cortesías por lo que
// valían, para ver cuánto se regaló.

export interface Tally {
  count: number;
  amountInCents: number;
}

export interface IssuerStats {
  // null: QRs emitidos antes de que se guardara quién los generó.
  name: string | null;
  offlinePaid: Tally;
  courtesy: Tally;
}

export interface DashboardStats {
  events: number;
  whitelisted: number;
  tickets: number;
  paidTickets: number;
  usedTickets: number;
  online: Tally;
  offlinePaid: Tally;
  courtesy: Tally;
  byIssuer: IssuerStats[];
}

interface EventFlag {
  isActive: boolean;
}

interface TicketRow {
  status: string;
  event: EventFlag;
  origin?: string;
  discountInCents?: number;
  chargedInCents?: number | null;
  faceValueInCents?: number | null;
  ticketType?: { price: number };
  issuedBy?: { id: string; name: string } | null;
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

  // Las cortesías quedan PAID para poder entrar, pero nadie las pagó.
  const paidTickets = confirmed.filter(
    (t) => t.status === "PAID" && t.origin !== "COURTESY"
  ).length;
  const usedTickets = confirmed.filter((t) => t.status === "USED").length;

  const emptyTally = (): Tally => ({ count: 0, amountInCents: 0 });
  const add = (tally: Tally, amountInCents: number) => {
    tally.count += 1;
    tally.amountInCents += amountInCents;
  };

  const online = emptyTally();
  const offlinePaid = emptyTally();
  const courtesy = emptyTally();
  const issuers = new Map<string, IssuerStats>();

  for (const ticket of confirmed) {
    if (ticket.origin === "OFFLINE_PAID" || ticket.origin === "COURTESY") {
      const key = ticket.issuedBy?.id ?? "";
      let issuer = issuers.get(key);
      if (!issuer) {
        issuer = {
          name: ticket.issuedBy?.name ?? null,
          offlinePaid: emptyTally(),
          courtesy: emptyTally(),
        };
        issuers.set(key, issuer);
      }

      if (ticket.origin === "OFFLINE_PAID") {
        const amount = ticket.chargedInCents ?? 0;
        add(offlinePaid, amount);
        add(issuer.offlinePaid, amount);
      } else {
        const amount = ticket.faceValueInCents ?? 0;
        add(courtesy, amount);
        add(issuer.courtesy, amount);
      }
    } else {
      add(
        online,
        (ticket.ticketType?.price ?? 0) - (ticket.discountInCents ?? 0)
      );
    }
  }

  // Los que más entradas dieron primero; los sin asignar al final.
  const byIssuer = [...issuers.values()].sort((a, b) => {
    if (a.name === null) return 1;
    if (b.name === null) return -1;
    return (
      b.offlinePaid.count + b.courtesy.count -
      (a.offlinePaid.count + a.courtesy.count)
    );
  });

  return {
    events: activeEvents.length,
    whitelisted: whitelistTotal || 0,
    tickets: confirmed.length,
    paidTickets,
    usedTickets,
    online,
    offlinePaid,
    courtesy,
    byIssuer,
  };
}
