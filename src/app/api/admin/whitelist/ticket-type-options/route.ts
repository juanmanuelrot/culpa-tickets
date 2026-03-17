import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const ticketTypes = await prisma.ticketType.findMany({
    where: { event: { isActive: true } },
    include: { event: { select: { id: true, name: true } } },
    orderBy: [{ event: { date: "desc" } }, { sortOrder: "asc" }],
  });

  return NextResponse.json(ticketTypes);
}
