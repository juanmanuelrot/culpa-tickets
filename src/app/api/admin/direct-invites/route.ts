import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import { createQRSignedToken, generateQRCodeDataUrl } from "@/lib/qr";
import { emailQrTicket, isQrOrigin, resolveQrAmounts } from "@/lib/qr-tickets";

// Issues a ticket straight away — a courtesy or one paid outside the site —
// and hands the QR back to the admin as an image. If the guest has an email,
// the ticket is mailed right away too.
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const {
      eventId,
      ticketTypeId,
      name,
      email,
      ticketValidUntil,
      origin,
      chargedInCents,
    } = await request.json();

    if (!eventId || !ticketTypeId || !name?.trim()) {
      return NextResponse.json(
        { error: "eventId, ticketTypeId, and name are required" },
        { status: 400 }
      );
    }

    if (!isQrOrigin(origin)) {
      return NextResponse.json(
        { error: "Elegí si es cortesía o pago por fuera" },
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

    const amounts = resolveQrAmounts(origin, chargedInCents, ticketType.price);
    if (!amounts) {
      return NextResponse.json(
        { error: "El monto cobrado no es válido" },
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
        origin,
        ...amounts,
        issuedById: admin.id,
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

    // A failed send doesn't undo the ticket: the admin still gets the QR and
    // a button to retry.
    let emailStatus: "none" | "sent" | "error" = "none";
    if (ticket.purchaserEmail) {
      try {
        await emailQrTicket({ ...ticket, qrSignedJwt, event, ticketType });
        emailStatus = "sent";
      } catch (error) {
        console.error("Direct invite auto email error:", error);
        emailStatus = "error";
      }
    }

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
        emailStatus,
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
