import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const events = await prisma.event.findMany({
    include: {
      ticketTypes: { orderBy: { sortOrder: "asc" } },
      _count: { select: { tickets: true } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(events);
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { name, description, date, location, coverImageUrl } = await request.json();

    if (!name || !date) {
      return NextResponse.json(
        { error: "name and date are required" },
        { status: 400 }
      );
    }

    let slug = slugify(name);
    const existing = await prisma.event.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const event = await prisma.event.create({
      data: {
        name,
        slug,
        description: description || null,
        date: new Date(date),
        location: location || null,
        coverImageUrl: coverImageUrl || null,
      },
      include: { ticketTypes: true },
    });

    return NextResponse.json(event, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
