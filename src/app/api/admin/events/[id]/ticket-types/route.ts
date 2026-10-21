import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: eventId } = await params;
  const { name, price, currency, capacity, validUntil, autoApproveWhitelist } = await request.json();

  if (!name || price === undefined) {
    return NextResponse.json(
      { error: "name and price are required" },
      { status: 400 }
    );
  }

  // New types go last so they don't jump ahead of the order set in the admin.
  const { _max } = await prisma.ticketType.aggregate({
    where: { eventId },
    _max: { sortOrder: true },
  });

  const ticketType = await prisma.ticketType.create({
    data: {
      eventId,
      name,
      price: Math.round(price),
      currency: currency || "UYU",
      capacity: capacity || null,
      validUntil: validUntil ? new Date(validUntil) : null,
      sortOrder: (_max.sortOrder ?? -1) + 1,
    },
  });

  if (autoApproveWhitelist) {
    const allWhitelisted = await prisma.whitelistedPerson.findMany({
      select: { id: true },
    });

    if (allWhitelisted.length > 0) {
      await prisma.whitelistedPersonTicketType.createMany({
        data: allWhitelisted.map((person) => ({
          whitelistedPersonId: person.id,
          ticketTypeId: ticketType.id,
        })),
      });
    }
  }

  return NextResponse.json(ticketType, { status: 201 });
}

// Body: { ids: string[] } with the event's ticket type ids in display order.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: eventId } = await params;
  const { ids } = await request.json();

  if (!Array.isArray(ids) || !ids.every((x) => typeof x === "string")) {
    return NextResponse.json({ error: "ids must be an array of strings" }, { status: 400 });
  }

  await prisma.$transaction(
    ids.map((ticketTypeId, index) =>
      prisma.ticketType.updateMany({
        where: { id: ticketTypeId, eventId },
        data: { sortOrder: index },
      })
    )
  );

  return NextResponse.json({ success: true });
}
