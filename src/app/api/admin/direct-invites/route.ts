import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import { createQRSignedToken, generateQRCodeDataUrl } from "@/lib/qr";

// Issues a free ticket straight away and hands the QR back to the admin as an
// image. No invite link, no email — the admin screenshots the QR and sends it
// however they like.
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { eventId, ticketTypeId, name, email, ticketValidUntil } =
      await request.json();

    if (!eventId || !ticketTypeId || !name?.trim()) {
      return NextResponse.json(
        { error: "eventId, ticketTypeId, and name are required" },
        { status: 400 }
      );
    }

    const [event, ticketType] = await Promise.all([
      prisma.event.findUnique({ where: { id: eventId } }),
      prisma.ticketType.findUnique({ where: { id: ticketTypeId } }),
    ]);

    if (!event || !ticketType) {
      return NextResponse.json(
        { error: "Event or ticket type not found" },
        { status: 404 }
      );
    }

    if (ticketType.eventId !== event.id) {
      return NextResponse.json(
        { error: "That ticket type does not belong to that event" },
        { status: 400 }
      );
    }

    const qrCodeToken = uuidv4();

    // Explicit override wins, otherwise fall back to the ticket type's default.
    const validUntil = ticketValidUntil
      ? new Date(ticketValidUntil)
      : ticketType.validUntil ?? null;

    const ticket = await prisma.ticket.create({
      data: {
        eventId: event.id,
        ticketTypeId: ticketType.id,
        qrCodeToken,
        validUntil,
        status: "PAID",
        purchaserName: name.trim(),
        purchaserEmail: email?.trim() ? email.trim().toLowerCase() : null,
      },
    });

    const qrSignedJwt = await createQRSignedToken({
      ticketId: ticket.id,
      qrCodeToken,
      eventId: event.id,
    });

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { qrSignedJwt },
    });

    return NextResponse.json(
      {
        ticketId: ticket.id,
        qrDataUrl: await generateQRCodeDataUrl(qrSignedJwt),
        guestName: ticket.purchaserName,
        guestEmail: ticket.purchaserEmail,
        eventName: event.name,
        eventDate: event.date,
        ticketTypeName: ticketType.name,
        validUntil,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Direct invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
