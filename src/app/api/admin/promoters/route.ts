import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { confirmedTicketsWhere } from "@/lib/tickets";
import { normalizeDiscountPercent, normalizePromoterCode } from "@/lib/promoters";

// Lists promoters with their confirmed tickets, optionally scoped to one event.
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const eventId = request.nextUrl.searchParams.get("eventId") || undefined;

  const promoters = await prisma.promoter.findMany({
    include: {
      _count: {
        select: { tickets: { where: { ...confirmedTicketsWhere, eventId } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Total descontado por RRPP, separado por moneda (cada tipo de entrada tiene la suya).
  const discounted = await prisma.ticket.findMany({
    where: { ...confirmedTicketsWhere, eventId, discountInCents: { gt: 0 } },
    select: {
      promoterId: true,
      discountInCents: true,
      ticketType: { select: { currency: true } },
    },
  });
  const discountTotals = new Map<string, Record<string, number>>();
  for (const t of discounted) {
    if (!t.promoterId) continue;
    const totals = discountTotals.get(t.promoterId) ?? {};
    const currency = t.ticketType.currency;
    totals[currency] = (totals[currency] ?? 0) + t.discountInCents;
    discountTotals.set(t.promoterId, totals);
  }

  return NextResponse.json(
    promoters.map(({ _count, ...p }) => ({
      ...p,
      ticketCount: _count.tickets,
      discountTotals: discountTotals.get(p.id) ?? {},
    }))
  );
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const name = (body.name || "").trim();
    const code = normalizePromoterCode(body.code || name);
    const discountPercent = normalizeDiscountPercent(body.discountPercent);

    if (!name || !code) {
      return NextResponse.json(
        { error: "name and code are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.promoter.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un RRPP con ese código" },
        { status: 409 }
      );
    }

    const promoter = await prisma.promoter.create({
      data: { name, code, discountPercent },
    });
    return NextResponse.json({ ...promoter, ticketCount: 0, discountTotals: {} }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
