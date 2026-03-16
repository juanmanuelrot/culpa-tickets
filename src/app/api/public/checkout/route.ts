import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createCheckoutPreference } from "@/lib/mercadopago";
import { v4 as uuidv4 } from "uuid";
import { createQRSignedToken, generateQRCodeDataURL } from "@/lib/qr";
import { sendTicketEmail } from "@/lib/email";
import { formatDate } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const { govIdNumber, eventId, ticketTypeId } = await request.json();

    if (!govIdNumber || !eventId || !ticketTypeId) {
      return NextResponse.json(
        { error: "govIdNumber, eventId, and ticketTypeId are required" },
        { status: 400 }
      );
    }

    // Re-verify whitelist status (security: don't trust client state)
    const person = await prisma.whitelistedPerson.findUnique({
      where: { govIdNumber: govIdNumber.trim().toUpperCase() },
      include: {
        allowedTicketTypes: true,
        tickets: {
          where: { eventId, ticketTypeId, status: { not: "CANCELLED" } },
        },
      },
    });

    if (!person) {
      return NextResponse.json(
        { error: "Not on the guest list" },
        { status: 403 }
      );
    }

    // Verify this person is allowed this ticket type
    const isAllowed = person.allowedTicketTypes.some(
      (att) => att.ticketTypeId === ticketTypeId
    );
    if (!isAllowed) {
      return NextResponse.json(
        { error: "You are not authorized for this ticket type" },
        { status: 403 }
      );
    }

    // Check if already purchased this ticket type for this event
    if (person.tickets.length > 0) {
      return NextResponse.json(
        { error: "You already have a ticket of this type for this event" },
        { status: 409 }
      );
    }

    const ticketType = await prisma.ticketType.findUnique({
      where: { id: ticketTypeId },
      include: { event: true },
    });

    if (!ticketType || ticketType.eventId !== eventId) {
      return NextResponse.json(
        { error: "Invalid ticket type" },
        { status: 400 }
      );
    }

    // Check capacity
    if (ticketType.capacity !== null) {
      const soldCount = await prisma.ticket.count({
        where: {
          ticketTypeId,
          status: { not: "CANCELLED" },
        },
      });
      if (soldCount >= ticketType.capacity) {
        return NextResponse.json(
          { error: "This ticket type is sold out" },
          { status: 409 }
        );
      }
    }

    // Handle free tickets (price = 0): create ticket directly as PAID
    if (ticketType.price === 0) {
      const qrCodeToken = uuidv4();
      const qrSignedJwt = await createQRSignedToken({
        ticketId: "", // Will be set after creation
        qrCodeToken,
        eventId,
      });

      const ticket = await prisma.ticket.create({
        data: {
          eventId,
          ticketTypeId,
          whitelistedPersonId: person.id,
          qrCodeToken,
          qrSignedJwt,
          status: "PAID",
          purchaserName: person.name,
          purchaserEmail: person.email,
          purchaserGovId: person.govIdNumber,
        },
      });

      // Update signed JWT with actual ticket ID
      const finalJwt = await createQRSignedToken({
        ticketId: ticket.id,
        qrCodeToken,
        eventId,
      });
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { qrSignedJwt: finalJwt },
      });

      // Send email with QR
      const qrDataUrl = await generateQRCodeDataURL(finalJwt);
      await sendTicketEmail({
        to: person.email,
        eventName: ticketType.event.name,
        ticketType: ticketType.name,
        date: formatDate(ticketType.event.date),
        purchaserName: person.name,
        qrDataUrl,
      });

      return NextResponse.json({
        success: true,
        free: true,
        ticketId: ticket.id,
      });
    }

    // Paid ticket: create PENDING_PAYMENT ticket and MercadoPago preference
    const ticket = await prisma.ticket.create({
      data: {
        eventId,
        ticketTypeId,
        whitelistedPersonId: person.id,
        status: "PENDING_PAYMENT",
        purchaserName: person.name,
        purchaserEmail: person.email,
        purchaserGovId: person.govIdNumber,
      },
    });

    const preference = await createCheckoutPreference({
      ticketId: ticket.id,
      title: `${ticketType.event.name} - ${ticketType.name}`,
      description: `Ticket for ${ticketType.event.name}`,
      priceInCents: ticketType.price,
      currency: ticketType.currency,
      payerEmail: person.email,
      payerName: person.name,
    });

    return NextResponse.json({
      success: true,
      free: false,
      ticketId: ticket.id,
      preferenceId: preference.id,
      checkoutUrl: preference.init_point,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
