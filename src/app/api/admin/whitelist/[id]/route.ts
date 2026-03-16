import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const person = await prisma.whitelistedPerson.findUnique({
    where: { id },
    include: {
      allowedTicketTypes: {
        include: { ticketType: { include: { event: true } } },
      },
      tickets: {
        include: { event: true, ticketType: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!person) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(person);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { name, email, instagramHandle, govIdNumber } = await request.json();

  const person = await prisma.whitelistedPerson.update({
    where: { id },
    data: {
      ...(name && { name: name.trim() }),
      ...(email && { email: email.trim().toLowerCase() }),
      ...(govIdNumber && { govIdNumber: govIdNumber.trim().toUpperCase() }),
      instagramHandle: instagramHandle?.trim() || null,
    },
  });

  return NextResponse.json(person);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.whitelistedPerson.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
