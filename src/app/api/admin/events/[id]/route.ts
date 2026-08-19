import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import {
  confirmedInvitationsWhere,
  confirmedTicketsWhere,
  soldTicketsWhere,
} from "@/lib/tickets";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  // Prisma allows a single filter per counted relation, so the invitation
  // tally needs its own pass alongside the sold-only _count.
  const [event, invitationCounts] = await Promise.all([
    prisma.event.findUnique({
      where: { id },
      include: {
        ticketTypes: {
          orderBy: { sortOrder: "asc" },
          include: {
            _count: { select: { tickets: { where: soldTicketsWhere } } },
          },
        },
        _count: { select: { tickets: { where: confirmedTicketsWhere } } },
      },
    }),
    prisma.ticket.groupBy({
      by: ["ticketTypeId"],
      where: { eventId: id, ...confirmedInvitationsWhere },
      _count: { _all: true },
    }),
  ]);

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const invitationsByType = new Map(
    invitationCounts.map((row) => [row.ticketTypeId, row._count._all])
  );

  return NextResponse.json({
    ...event,
    ticketTypes: event.ticketTypes.map((tt) => ({
      ...tt,
      invitationCount: invitationsByType.get(tt.id) ?? 0,
    })),
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const data = await request.json();

  const event = await prisma.event.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.date !== undefined && { date: new Date(data.date) }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.locationRevealed !== undefined && { locationRevealed: data.locationRevealed }),
      ...(data.coverImageUrl !== undefined && { coverImageUrl: data.coverImageUrl }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
    },
    include: { ticketTypes: true },
  });

  return NextResponse.json(event);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
