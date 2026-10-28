import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { emailQrTicket } from "@/lib/qr-tickets";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Re-sends an already-issued ticket's QR (the same one) to its holder. An
// optional `email` in the body fixes a mistyped address before sending.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const newEmail =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (newEmail && !EMAIL_RE.test(newEmail)) {
      return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { event: true, ticketType: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (!ticket.qrSignedJwt) {
      return NextResponse.json(
        { error: "This ticket has no QR code yet" },
        { status: 409 }
      );
    }

    if (newEmail && newEmail !== ticket.purchaserEmail) {
      await prisma.ticket.update({
        where: { id },
        data: { purchaserEmail: newEmail },
      });
      ticket.purchaserEmail = newEmail;
    }

    if (!ticket.purchaserEmail) {
      return NextResponse.json(
        { error: "This ticket has no email address" },
        { status: 400 }
      );
    }

    await emailQrTicket(ticket);

    return NextResponse.json({ success: true, email: ticket.purchaserEmail });
  } catch (error) {
    console.error("Ticket email error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
