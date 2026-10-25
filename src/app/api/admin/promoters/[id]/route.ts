import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { normalizeDiscountPercent } from "@/lib/promoters";

// Only the name, the discount and the active flag are editable: the code is
// already out in shared links, so changing it would orphan them.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  try {
    const { name, isActive, discountPercent } = await request.json();

    const data: { name?: string; isActive?: boolean; discountPercent?: number } = {};
    if (typeof name === "string" && name.trim()) data.name = name.trim();
    if (typeof isActive === "boolean") data.isActive = isActive;
    if (discountPercent !== undefined) {
      data.discountPercent = normalizeDiscountPercent(discountPercent);
    }

    const promoter = await prisma.promoter.update({ where: { id }, data });
    return NextResponse.json(promoter);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
