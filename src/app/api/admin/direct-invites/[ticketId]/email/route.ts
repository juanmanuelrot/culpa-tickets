import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { generateQRCodeBuffer } from "@/lib/qr";
import { sendTicketEmail } from "@/lib/email";
import { formatDate } from "@/lib/utils";

// Opt-in only: emails an already-issued ticket's QR to its holder. Issuing a
// direct invite never sends mail on its own.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { ticketId } = await params;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { event: true, ticketType: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (!ticket.purchaserEmail) {
      return NextResponse.json(
        { error: "This ticket has no email address" },
        { status: 400 }
      );
    }

    if (!ticket.qrSignedJwt) {
      return NextResponse.json(
        { error: "This ticket has no QR code yet" },
        { status: 409 }
      );
    }

    await sendTicketEmail({
      to: ticket.purchaserEmail,
      eventName: ticket.event.name,
      ticketType: ticket.ticketType.name,
      date: formatDate(ticket.event.date),
      purchaserName: ticket.purchaserName,
      qrCodeBuffer: await generateQRCodeBuffer(ticket.qrSignedJwt),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Direct invite email error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
