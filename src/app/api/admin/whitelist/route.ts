import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { govIdNumber: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { instagramHandle: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [people, total] = await Promise.all([
    prisma.whitelistedPerson.findMany({
      where,
      include: {
        allowedTicketTypes: {
          include: { ticketType: { include: { event: true } } },
        },
        _count: { select: { tickets: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.whitelistedPerson.count({ where }),
  ]);

  return NextResponse.json({ people, total, page, limit });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { govIdNumber, name, email, instagramHandle, ticketTypeIds } = await request.json();

    if (!govIdNumber || !name || !email) {
      return NextResponse.json(
        { error: "govIdNumber, name, and email are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.whitelistedPerson.findUnique({
      where: { govIdNumber: govIdNumber.trim().toUpperCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Person with this ID number already exists" },
        { status: 409 }
      );
    }

    const person = await prisma.whitelistedPerson.create({
      data: {
        govIdNumber: govIdNumber.trim().toUpperCase(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        instagramHandle: instagramHandle?.trim() || null,
      },
    });

    if (Array.isArray(ticketTypeIds) && ticketTypeIds.length > 0) {
      await prisma.whitelistedPersonTicketType.createMany({
        data: ticketTypeIds.map((ticketTypeId: string) => ({
          whitelistedPersonId: person.id,
          ticketTypeId,
        })),
      });
    }

    // Send welcome email with the events the person has access to
    try {
      const events = Array.isArray(ticketTypeIds) && ticketTypeIds.length > 0
        ? await prisma.event.findMany({
            where: {
              ticketTypes: { some: { id: { in: ticketTypeIds } } },
              isActive: true,
            },
            select: { name: true, date: true, slug: true },
            distinct: ["id"],
            orderBy: { date: "asc" },
          })
        : [];

      await sendWelcomeEmail({
        to: person.email,
        name: person.name,
        events,
      });
    } catch {
      // Email failure should not block the whitelist creation
      console.error("Failed to send welcome email to", person.email);
    }

    return NextResponse.json(person, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
