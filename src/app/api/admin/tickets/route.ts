import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const searchParams = request.nextUrl.searchParams;
  const eventId = searchParams.get("eventId");
  const status = searchParams.get("status");
  const search = searchParams.get("search") || "";

  const where = {
    ...(eventId && { eventId }),
    ...(status && { status: status as "PENDING_PAYMENT" | "PAID" | "USED" | "CANCELLED" }),
    ...(search && {
      OR: [
        { purchaserName: { contains: search, mode: "insensitive" as const } },
        { purchaserEmail: { contains: search, mode: "insensitive" as const } },
        { purchaserGovId: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      event: true,
      ticketType: true,
      scans: { orderBy: { scannedAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tickets);
}
