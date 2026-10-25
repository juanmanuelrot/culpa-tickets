import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizePromoterCode } from "@/lib/promoters";

// Descuento del link de RRPP, para que la página del evento muestre el precio
// que se va a cobrar. Un código desconocido o desactivado es 0%, nunca un error.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const code = normalizePromoterCode((await params).code);
  const promoter = code
    ? await prisma.promoter.findFirst({
        where: { code, isActive: true },
        select: { discountPercent: true },
      })
    : null;

  return NextResponse.json(
    { discountPercent: promoter?.discountPercent ?? 0 },
    { headers: { "cache-control": "no-store" } }
  );
}
