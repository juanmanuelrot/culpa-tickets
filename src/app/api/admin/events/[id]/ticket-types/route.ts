import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: eventId } = await params;
  const { name, price, currency, capacity, sortOrder } = await request.json();

  if (!name || price === undefined) {
    return NextResponse.json(
      { error: "name and price are required" },
      { status: 400 }
    );
  }

  const ticketType = await prisma.ticketType.create({
    data: {
      eventId,
      name,
      price: Math.round(price),
      currency: currency || "ARS",
      capacity: capacity || null,
      sortOrder: sortOrder || 0,
    },
  });

  return NextResponse.json(ticketType, { status: 201 });
}
