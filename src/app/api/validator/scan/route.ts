import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireValidator } from "@/lib/auth";
import { verifyQRToken } from "@/lib/qr";

export async function POST(request: NextRequest) {
  const user = await requireValidator(request);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { qrData } = await request.json();

    if (!qrData) {
      return NextResponse.json(
        { error: "QR data is required" },
        { status: 400 }
      );
    }

    // Step 1: Verify the signed JWT from QR code
    const qrPayload = await verifyQRToken(qrData);
    if (!qrPayload) {
      // Log invalid scan attempt
      return NextResponse.json({
        valid: false,
        error: "Invalid or forged QR code",
      });
    }

    // Step 2: Look up ticket by qrCodeToken (double verification)
    const ticket = await prisma.ticket.findUnique({
      where: { qrCodeToken: qrPayload.qrCodeToken },
      include: { event: true, ticketType: true },
    });

    if (!ticket) {
      return NextResponse.json({
        valid: false,
        error: "Ticket not found",
      });
    }

    // Step 3: Verify ticket ID matches
    if (ticket.id !== qrPayload.ticketId) {
      return NextResponse.json({
        valid: false,
        error: "QR code data mismatch",
      });
    }

    // Step 4: Check if ticket has expired
    if (ticket.validUntil && new Date() > new Date(ticket.validUntil)) {
      await prisma.scan.create({
        data: {
          ticketId: ticket.id,
          validatorId: user.id,
          wasValid: false,
        },
      });

      return NextResponse.json({
        valid: false,
        error: "Ticket has expired",
        expiredAt: ticket.validUntil,
        ticket: {
          purchaserName: ticket.purchaserName,
          ticketType: ticket.ticketType.name,
          event: ticket.event.name,
        },
      });
    }

    // Step 5: Check ticket status
    if (ticket.status === "USED") {
      // Find when it was first scanned
      const firstScan = await prisma.scan.findFirst({
        where: { ticketId: ticket.id, wasValid: true },
        orderBy: { scannedAt: "asc" },
      });

      // Log duplicate scan
      await prisma.scan.create({
        data: {
          ticketId: ticket.id,
          validatorId: user.id,
          wasValid: false,
        },
      });

      return NextResponse.json({
        valid: false,
        error: "Ticket already used",
        usedAt: firstScan?.scannedAt,
        ticket: {
          purchaserName: ticket.purchaserName,
          ticketType: ticket.ticketType.name,
          event: ticket.event.name,
        },
      });
    }

    if (ticket.status !== "PAID") {
      return NextResponse.json({
        valid: false,
        error: `Ticket status is ${ticket.status}`,
      });
    }

    // Step 5: Mark as USED and log scan
    await prisma.$transaction([
      prisma.ticket.update({
        where: { id: ticket.id },
        data: { status: "USED" },
      }),
      prisma.scan.create({
        data: {
          ticketId: ticket.id,
          validatorId: user.id,
          wasValid: true,
        },
      }),
    ]);

    return NextResponse.json({
      valid: true,
      ticket: {
        purchaserName: ticket.purchaserName,
        ticketType: ticket.ticketType.name,
        event: ticket.event.name,
      },
    });
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
