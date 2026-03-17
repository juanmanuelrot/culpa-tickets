import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { maskEmail } from "@/lib/utils";

// Simple in-memory rate limiting for lookup endpoint
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }

  entry.count++;
  return entry.count > 5; // 5 attempts per minute
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const { govIdNumber, eventSlug } = await request.json();

    if (!govIdNumber || !eventSlug) {
      return NextResponse.json(
        { error: "ID number and event are required" },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { slug: eventSlug, isActive: true },
      include: { ticketTypes: { orderBy: { sortOrder: "asc" } } },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const person = await prisma.whitelistedPerson.findUnique({
      where: { govIdNumber: govIdNumber.trim().toUpperCase() },
      include: {
        allowedTicketTypes: {
          include: { ticketType: true },
          where: {
            ticketType: { eventId: event.id },
          },
        },
        tickets: {
          where: { eventId: event.id, status: { not: "CANCELLED" } },
        },
      },
    });

    if (!person) {
      return NextResponse.json(
        { error: "You are not on the guest list for this event" },
        { status: 403 }
      );
    }

    // Get allowed ticket types for this event
    const allowedTicketTypeIds = person.allowedTicketTypes.map(
      (att) => att.ticketTypeId
    );

    const availableTicketTypes = event.ticketTypes.filter((tt) =>
      allowedTicketTypeIds.includes(tt.id)
    );

    // Check which ticket types the person already purchased (only confirmed tickets)
    const paidTickets = person.tickets.filter((t) => t.status === "PAID" || t.status === "USED");
    const purchasedTicketTypeIds = paidTickets.map((t) => t.ticketTypeId);
    const pendingTicketTypeIds = person.tickets
      .filter((t) => t.status === "PENDING_PAYMENT")
      .map((t) => t.ticketTypeId);

    return NextResponse.json({
      person: {
        name: person.name,
        email: maskEmail(person.email),
        govIdNumber: person.govIdNumber,
      },
      event: {
        id: event.id,
        name: event.name,
        slug: event.slug,
        date: event.date,
        location: event.locationRevealed ? event.location : null,
      },
      availableTicketTypes: availableTicketTypes.map((tt) => ({
        id: tt.id,
        name: tt.name,
        price: tt.price,
        currency: tt.currency,
        validUntil: tt.validUntil,
        alreadyPurchased: purchasedTicketTypeIds.includes(tt.id),
        pendingPayment: pendingTicketTypeIds.includes(tt.id) && !purchasedTicketTypeIds.includes(tt.id),
        soldOut: tt.capacity !== null
          ? paidTickets.filter((t) => t.ticketTypeId === tt.id).length >= 1
          : false,
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
