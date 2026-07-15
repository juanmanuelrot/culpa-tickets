import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; ticketTypeId: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { ticketTypeId } = await params;
  const data = await request.json();

  const ticketType = await prisma.ticketType.update({
    where: { id: ticketTypeId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.price !== undefined && { price: Math.round(data.price) }),
      ...(data.currency !== undefined && { currency: data.currency }),
      ...(data.capacity !== undefined && { capacity: data.capacity }),
      ...(data.isOffered !== undefined && { isOffered: data.isOffered }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
    },
  });

  return NextResponse.json(ticketType);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; ticketTypeId: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { ticketTypeId } = await params;
  await prisma.ticketType.delete({ where: { id: ticketTypeId } });
  return NextResponse.json({ success: true });
}
