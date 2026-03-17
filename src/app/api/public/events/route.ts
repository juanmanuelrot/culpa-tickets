import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const events = await prisma.event.findMany({
    where: { isActive: true },
    orderBy: { date: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      date: true,
      location: true,
      coverImageUrl: true,
    },
  });

  return NextResponse.json(events);
}
