import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { createQRSignedToken, generateQRCodeDataURL } from "@/lib/qr";
import { sendTicketEmail } from "@/lib/email";
import { formatDate } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const { token, name, email } = await request.json();

    if (!token || !name || !email) {
      return NextResponse.json(
        { error: "token, name, and email are required" },
        { status: 400 }
      );
    }

    const link = await prisma.freeInviteLink.findUnique({
      where: { token },
    });

    if (!link) {
      return NextResponse.json(
        { error: "Invalid invite link" },
        { status: 404 }
      );
    }

    if (new Date() > link.expiresAt) {
      return NextResponse.json(
        { error: "This invite link has expired" },
        { status: 410 }
      );
    }

    if (link.usedCount >= link.maxUses) {
      return NextResponse.json(
        { error: "This invite link has been fully used" },
        { status: 410 }
      );
    }

    // Get event and ticket type info
    const [event, ticketType] = await Promise.all([
      prisma.event.findUnique({ where: { id: link.eventId } }),
      prisma.ticketType.findUnique({ where: { id: link.ticketTypeId } }),
    ]);

    if (!event || !ticketType) {
      return NextResponse.json(
        { error: "Event or ticket type not found" },
        { status: 404 }
      );
    }

    const qrCodeToken = uuidv4();

    // Create ticket and increment usage atomically
    const [ticket] = await prisma.$transaction([
      prisma.ticket.create({
        data: {
          eventId: link.eventId,
          ticketTypeId: link.ticketTypeId,
          freeInviteLinkId: link.id,
          qrCodeToken,
          status: "PAID",
          purchaserName: name.trim(),
          purchaserEmail: email.trim().toLowerCase(),
        },
      }),
      prisma.freeInviteLink.update({
        where: { id: link.id },
        data: { usedCount: { increment: 1 } },
      }),
    ]);

    // Sign the QR token
    const qrSignedJwt = await createQRSignedToken({
      ticketId: ticket.id,
      qrCodeToken,
      eventId: link.eventId,
    });

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { qrSignedJwt },
    });

    // Send email
    const qrDataUrl = await generateQRCodeDataURL(qrSignedJwt);
    await sendTicketEmail({
      to: email.trim().toLowerCase(),
      eventName: event.name,
      ticketType: ticketType.name,
      date: formatDate(event.date),
      purchaserName: name.trim(),
      qrDataUrl,
    });

    return NextResponse.json({ success: true, ticketId: ticket.id, eventSlug: event.slug });
  } catch (error) {
    console.error("Free invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
