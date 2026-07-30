import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Public event details. For public events, returns the event plus its active
// ticket types (with sold-out info) to anyone, no whitelist gate. For private
// events, returns only enough for the page to fall back to the gov-ID lookup.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const event = await prisma.event.findUnique({
    where: { slug, isActive: true },
    include: { ticketTypes: { orderBy: { sortOrder: "asc" } } },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const base = {
    event: {
      id: event.id,
      name: event.name,
      slug: event.slug,
      description: event.description,
      date: event.date,
      location: event.locationRevealed ? event.location : null,
      coverImageUrl: event.coverImageUrl,
      isPublic: event.isPublic,
    },
  };

  // Private events keep the gov-ID lookup flow; don't leak ticket types here.
  if (!event.isPublic) {
    return NextResponse.json(base);
  }

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

  return NextResponse.json({
    ...base,
    ticketTypes: event.ticketTypes.map((tt) => ({
      id: tt.id,
      name: tt.name,
      price: tt.price,
      currency: tt.currency,
      soldOut:
        !tt.isOffered ||
        (tt.capacity !== null && (soldByType.get(tt.id) ?? 0) >= tt.capacity),
    })),
  });
}
