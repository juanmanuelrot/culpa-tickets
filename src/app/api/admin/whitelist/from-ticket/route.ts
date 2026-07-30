import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// Promote a public purchaser to the whitelist using their ticket's buyer info.
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { ticketId } = await request.json();
    if (!ticketId) {
      return NextResponse.json({ error: "ticketId is required" }, { status: 400 });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (ticket.whitelistedPersonId) {
      return NextResponse.json(
        { error: "This purchaser is already on the list" },
        { status: 409 }
      );
    }

    if (!ticket.purchaserGovId) {
      return NextResponse.json(
        { error: "Ticket has no ID number to add" },
        { status: 400 }
      );
    }

    if (!ticket.purchaserEmail) {
      return NextResponse.json(
        { error: "Ticket has no email address to add" },
        { status: 400 }
      );
    }

    const govIdNumber = ticket.purchaserGovId.trim().toUpperCase();

    const existing = await prisma.whitelistedPerson.findUnique({
      where: { govIdNumber },
    });
    if (existing) {
      // Link the ticket to the existing person, but don't duplicate the record.
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { whitelistedPersonId: existing.id },
      });
      return NextResponse.json(
        { error: "A person with this ID is already on the list", person: existing },
        { status: 409 }
      );
    }

    const person = await prisma.whitelistedPerson.create({
      data: {
        govIdNumber,
        name: ticket.purchaserName,
        email: ticket.purchaserEmail.trim().toLowerCase(),
      },
    });

    // Link this ticket (and any other public tickets from the same buyer).
    await prisma.ticket.updateMany({
      where: { purchaserGovId: ticket.purchaserGovId, whitelistedPersonId: null },
      data: { whitelistedPersonId: person.id },
    });

    return NextResponse.json({ success: true, person }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
