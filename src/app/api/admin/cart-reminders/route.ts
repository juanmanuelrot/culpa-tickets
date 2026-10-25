import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { soldTicketsWhere } from "@/lib/tickets";
import { reminderKey, summarizeReminders } from "@/lib/cart-reminders";

// Métrica del panel: mails de carrito abandonado enviados y cuántas de esas
// personas terminaron comprando. Como el resto del panel, solo eventos activos.
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const reminders = await prisma.cartReminder.findMany({
    where: { event: { isActive: true } },
    select: { email: true, eventId: true, stage: true },
  });
  const eventIds = [...new Set(reminders.map((r) => r.eventId))];

  const sold = await prisma.ticket.findMany({
    where: { ...soldTicketsWhere, eventId: { in: eventIds }, purchaserEmail: { not: null } },
    select: { purchaserEmail: true, eventId: true },
  });

  return NextResponse.json(
    summarizeReminders({
      reminders,
      sold: new Set(sold.map((t) => reminderKey(t.purchaserEmail!, t.eventId))),
    })
  );
}
