import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireValidator } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await requireValidator(request);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const scans = await prisma.scan.findMany({
    where: { validatorId: user.id },
    include: {
      ticket: {
        include: { event: true, ticketType: true },
      },
    },
    orderBy: { scannedAt: "desc" },
    take: 10,
  });

  return NextResponse.json(scans);
}
