import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const links = await prisma.freeInviteLink.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { tickets: true } } },
  });

  return NextResponse.json(links);
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { eventId, ticketTypeId, expiresAt, maxUses } = await request.json();

  if (!eventId || !ticketTypeId || !expiresAt) {
    return NextResponse.json(
      { error: "eventId, ticketTypeId, and expiresAt are required" },
      { status: 400 }
    );
  }

  const link = await prisma.freeInviteLink.create({
    data: {
      eventId,
      ticketTypeId,
      expiresAt: new Date(expiresAt),
      maxUses: maxUses || 1,
      createdBy: admin.id,
    },
  });

  return NextResponse.json({
    ...link,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${link.token}`,
  }, { status: 201 });
}
