import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; ticketTypeId: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { ticketTypeId } = await params;

  const ticketType = await prisma.ticketType.findUnique({
    where: { id: ticketTypeId },
  });

  if (!ticketType) {
    return NextResponse.json({ error: "Ticket type not found" }, { status: 404 });
  }

  const allWhitelisted = await prisma.whitelistedPerson.findMany({
    select: { id: true },
  });

  if (allWhitelisted.length === 0) {
    return NextResponse.json({ approved: 0 });
  }

  const result = await prisma.whitelistedPersonTicketType.createMany({
    data: allWhitelisted.map((person) => ({
      whitelistedPersonId: person.id,
      ticketTypeId,
    })),
    skipDuplicates: true,
  });

  return NextResponse.json({ approved: result.count });
}
