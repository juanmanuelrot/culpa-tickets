import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { ticketTypeIds } = await request.json() as { ticketTypeIds: string[] };

  if (!Array.isArray(ticketTypeIds)) {
    return NextResponse.json(
      { error: "ticketTypeIds must be an array" },
      { status: 400 }
    );
  }

  // Delete existing and recreate
  await prisma.whitelistedPersonTicketType.deleteMany({
    where: { whitelistedPersonId: id },
  });

  if (ticketTypeIds.length > 0) {
    await prisma.whitelistedPersonTicketType.createMany({
      data: ticketTypeIds.map((ticketTypeId) => ({
        whitelistedPersonId: id,
        ticketTypeId,
      })),
    });
  }

  const person = await prisma.whitelistedPerson.findUnique({
    where: { id },
    include: {
      allowedTicketTypes: {
        include: { ticketType: { include: { event: true } } },
      },
    },
  });

  return NextResponse.json(person);
}
