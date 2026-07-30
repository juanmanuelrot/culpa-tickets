import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createCheckoutPreference } from "@/lib/mercadopago";
import { v4 as uuidv4 } from "uuid";
import { createQRSignedToken, generateQRCodeBuffer } from "@/lib/qr";
import { sendTicketEmail } from "@/lib/email";
import { formatDate } from "@/lib/utils";

interface Purchaser {
  name: string;
  email: string;
  govId: string;
  whitelistedPersonId: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, ticketTypeId } = body;

    if (!eventId || !ticketTypeId) {
      return NextResponse.json(
        { error: "eventId and ticketTypeId are required" },
        { status: 400 }
      );
    }

    const ticketType = await prisma.ticketType.findUnique({
      where: { id: ticketTypeId },
      include: { event: true },
    });

    if (!ticketType || ticketType.eventId !== eventId) {
      return NextResponse.json({ error: "Invalid ticket type" }, { status: 400 });
    }

    if (!ticketType.event.isActive) {
      return NextResponse.json({ error: "Event not available" }, { status: 404 });
    }

    if (!ticketType.isOffered) {
      return NextResponse.json(
        { error: "This ticket type is no longer offered" },
        { status: 409 }
      );
    }

    // Resolve the purchaser differently for public vs. whitelist events.
    let purchaser: Purchaser;

    if (ticketType.event.isPublic) {
      // Public event: collect buyer identity, no whitelist gate, no per-person limit.
      const firstName = (body.firstName || "").trim();
      const lastName = (body.lastName || "").trim();
      const email = (body.email || "").trim().toLowerCase();
      const govId = (body.govIdNumber || "").trim().toUpperCase();

      if (!firstName || !lastName || !email || !govId) {
        return NextResponse.json(
          { error: "First name, last name, ID and email are required" },
          { status: 400 }
        );
      }

      purchaser = {
        name: `${firstName} ${lastName}`,
        email,
        govId,
        whitelistedPersonId: null,
      };
    } else {
      // Private event: re-verify whitelist status (don't trust client state).
      const govIdNumber = body.govIdNumber;
      if (!govIdNumber) {
        return NextResponse.json(
          { error: "govIdNumber is required" },
          { status: 400 }
        );
      }

      const person = await prisma.whitelistedPerson.findUnique({
        where: { govIdNumber: govIdNumber.trim().toUpperCase() },
        include: {
          allowedTicketTypes: true,
          tickets: {
            where: { eventId, ticketTypeId, status: { in: ["PAID", "USED"] } },
          },
        },
      });

      if (!person) {
        return NextResponse.json({ error: "Not on the guest list" }, { status: 403 });
      }

      const isAllowed = person.allowedTicketTypes.some(
        (att) => att.ticketTypeId === ticketTypeId
      );
      if (!isAllowed) {
        return NextResponse.json(
          { error: "You are not authorized for this ticket type" },
          { status: 403 }
        );
      }

      // One ticket of each type per person on private events.
      if (person.tickets.length > 0) {
        return NextResponse.json(
          { error: "You already have a ticket of this type for this event" },
          { status: 409 }
        );
      }

      // Cancel any stale PENDING_PAYMENT tickets so the user can retry.
      await prisma.ticket.updateMany({
        where: {
          whitelistedPersonId: person.id,
          eventId,
          ticketTypeId,
          status: "PENDING_PAYMENT",
        },
        data: { status: "CANCELLED" },
      });

      purchaser = {
        name: person.name,
        email: person.email,
        govId: person.govIdNumber,
        whitelistedPersonId: person.id,
      };
    }

    // Capacity check (only confirmed tickets, not abandoned PENDING_PAYMENT).
    if (ticketType.capacity !== null) {
      const soldCount = await prisma.ticket.count({
        where: { ticketTypeId, status: { in: ["PAID", "USED"] } },
      });
      if (soldCount >= ticketType.capacity) {
        return NextResponse.json(
          { error: "This ticket type is sold out" },
          { status: 409 }
        );
      }
    }

    // Free tickets (price = 0): create ticket directly as PAID.
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
          whitelistedPersonId: purchaser.whitelistedPersonId,
          qrCodeToken,
          qrSignedJwt,
          validUntil: ticketType.validUntil,
          status: "PAID",
          purchaserName: purchaser.name,
          purchaserEmail: purchaser.email,
          purchaserGovId: purchaser.govId,
        },
      });

      const finalJwt = await createQRSignedToken({
        ticketId: ticket.id,
        qrCodeToken,
        eventId,
      });
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { qrSignedJwt: finalJwt },
      });

      const qrCodeBuffer = await generateQRCodeBuffer(finalJwt);
      await sendTicketEmail({
        to: purchaser.email,
        eventName: ticketType.event.name,
        ticketType: ticketType.name,
        date: formatDate(ticketType.event.date),
        purchaserName: purchaser.name,
        qrCodeBuffer,
      });

      return NextResponse.json({
        success: true,
        free: true,
        ticketId: ticket.id,
      });
    }

    // Paid ticket: create PENDING_PAYMENT ticket and MercadoPago preference.
    const ticket = await prisma.ticket.create({
      data: {
        eventId,
        ticketTypeId,
        whitelistedPersonId: purchaser.whitelistedPersonId,
        validUntil: ticketType.validUntil,
        status: "PENDING_PAYMENT",
        purchaserName: purchaser.name,
        purchaserEmail: purchaser.email,
        purchaserGovId: purchaser.govId,
      },
    });

    const preference = await createCheckoutPreference({
      ticketId: ticket.id,
      title: `${ticketType.event.name} - ${ticketType.name}`,
      description: `Ticket for ${ticketType.event.name}`,
      priceInCents: ticketType.price,
      currency: ticketType.currency,
      payerEmail: purchaser.email,
      payerName: purchaser.name,
      eventSlug: ticketType.event.slug,
      eventName: ticketType.event.name,
      eventDate: ticketType.event.date,
      ticketValidUntil: ticketType.validUntil,
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
