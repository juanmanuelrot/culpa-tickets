import { prisma } from "@/lib/db";

/*
 * Lo que ve cualquiera de un evento: la página del evento lo lee al renderizar
 * y /api/public/events/[slug] lo devuelve tal cual, con sus entradas activas
 * (con agotado).
 */

export interface PublicEventInfo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  date: string;
  location: string | null;
  coverImageUrl: string | null;
}

export interface PublicEventTicketType {
  id: string;
  name: string;
  price: number;
  currency: string;
  soldOut: boolean;
}

export interface PublicEventData {
  event: PublicEventInfo;
  ticketTypes: PublicEventTicketType[];
}

export async function getPublicEvent(
  slug: string
): Promise<PublicEventData | null> {
  const event = await prisma.event.findUnique({
    where: { slug, isActive: true },
    include: { ticketTypes: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
  });

  if (!event) return null;

  // Count confirmed sales per ticket type in one query.
  const soldCounts = await prisma.ticket.groupBy({
    by: ["ticketTypeId"],
    where: {
      eventId: event.id,
      status: { in: ["PAID", "USED"] },
    },
    _count: { _all: true },
  });
  const soldByType = new Map(
    soldCounts.map((row) => [row.ticketTypeId, row._count._all])
  );

  return {
    event: {
      id: event.id,
      name: event.name,
      slug: event.slug,
      description: event.description,
      date: event.date.toISOString(),
      location: event.locationRevealed ? event.location : null,
      coverImageUrl: event.coverImageUrl,
    },
    ticketTypes: event.ticketTypes.map((tt) => ({
      id: tt.id,
      name: tt.name,
      price: tt.price,
      currency: tt.currency,
      soldOut:
        !tt.isOffered ||
        (tt.capacity !== null && (soldByType.get(tt.id) ?? 0) >= tt.capacity),
    })),
  };
}
