import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { confirmedTicketsWhere } from "@/lib/tickets";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  // Online, offline-paid and courtesy tickets per type, in one pass.
  const [event, originCounts] = await Promise.all([
    prisma.event.findUnique({
      where: { id },
      include: {
        ticketTypes: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
        _count: { select: { tickets: { where: confirmedTicketsWhere } } },
      },
    }),
    prisma.ticket.groupBy({
      by: ["ticketTypeId", "origin"],
      where: { eventId: id, ...confirmedTicketsWhere },
      _count: { _all: true },
    }),
  ]);

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const countFor = (ticketTypeId: string, origin: string) =>
    originCounts.find(
      (row) => row.ticketTypeId === ticketTypeId && row.origin === origin
    )?._count._all ?? 0;

  return NextResponse.json({
    ...event,
    ticketTypes: event.ticketTypes.map((tt) => ({
      ...tt,
      onlineCount: countFor(tt.id, "ONLINE"),
      offlinePaidCount: countFor(tt.id, "OFFLINE_PAID"),
      courtesyCount: countFor(tt.id, "COURTESY"),
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
