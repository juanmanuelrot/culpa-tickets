import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// Only the name and the active flag are editable: the code is already out in
// shared links, so changing it would orphan them.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  try {
    const { name, isActive } = await request.json();

    const data: { name?: string; isActive?: boolean } = {};
    if (typeof name === "string" && name.trim()) data.name = name.trim();
    if (typeof isActive === "boolean") data.isActive = isActive;

    const promoter = await prisma.promoter.update({ where: { id }, data });
    return NextResponse.json(promoter);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
