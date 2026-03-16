import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { govIdNumber: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { instagramHandle: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [people, total] = await Promise.all([
    prisma.whitelistedPerson.findMany({
      where,
      include: {
        allowedTicketTypes: {
          include: { ticketType: { include: { event: true } } },
        },
        _count: { select: { tickets: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.whitelistedPerson.count({ where }),
  ]);

  return NextResponse.json({ people, total, page, limit });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { govIdNumber, name, email, instagramHandle } = await request.json();

    if (!govIdNumber || !name || !email) {
      return NextResponse.json(
        { error: "govIdNumber, name, and email are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.whitelistedPerson.findUnique({
      where: { govIdNumber: govIdNumber.trim().toUpperCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Person with this ID number already exists" },
        { status: 409 }
      );
    }

    const person = await prisma.whitelistedPerson.create({
      data: {
        govIdNumber: govIdNumber.trim().toUpperCase(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        instagramHandle: instagramHandle?.trim() || null,
      },
    });

    return NextResponse.json(person, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
