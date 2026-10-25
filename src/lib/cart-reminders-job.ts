import { prisma } from "@/lib/db";
import { sendCartReminderEmail } from "@/lib/email";
import { confirmedTicketsWhere } from "@/lib/tickets";
import {
  REMINDER_WINDOW,
  normalizeEmail,
  planReminders,
  reminderKey,
} from "@/lib/cart-reminders";

// Una vuelta del cron: busca intentos abandonados recientes y manda los mails
// que correspondan. Se puede correr en paralelo sin duplicar: cada mail se
// reserva primero en CartReminder (unique por email, evento y etapa).
export async function runCartReminders(now = new Date()): Promise<number> {
  const tickets = await prisma.ticket.findMany({
    where: {
      status: { in: ["PENDING_PAYMENT", "CANCELLED"] },
      purchaserEmail: { not: null },
      createdAt: { gte: new Date(now.getTime() - REMINDER_WINDOW) },
      event: { isActive: true, date: { gt: now } },
    },
    include: {
      event: { select: { name: true, date: true, slug: true } },
      ticketType: { select: { name: true } },
      promoter: { select: { code: true } },
    },
  });
  if (tickets.length === 0) return 0;

  const attempts = tickets.map((t) => ({ ...t, email: t.purchaserEmail! }));
  const eventIds = [...new Set(attempts.map((a) => a.eventId))];

  const [confirmedTickets, sentReminders] = await Promise.all([
    prisma.ticket.findMany({
      where: { ...confirmedTicketsWhere, eventId: { in: eventIds }, purchaserEmail: { not: null } },
      select: { purchaserEmail: true, eventId: true },
    }),
    prisma.cartReminder.findMany({
      where: { eventId: { in: eventIds } },
      select: { email: true, eventId: true, stage: true },
    }),
  ]);

  const planned = planReminders({
    attempts,
    confirmed: new Set(confirmedTickets.map((t) => reminderKey(t.purchaserEmail!, t.eventId))),
    sent: new Set(sentReminders.map((r) => `${reminderKey(r.email, r.eventId)}|${r.stage}`)),
    now,
  });

  let sent = 0;
  for (const { email, eventId, stage, latest } of planned) {
    let reservation;
    try {
      reservation = await prisma.cartReminder.create({
        data: { email: normalizeEmail(email), eventId, stage },
      });
    } catch (error) {
      // Otra vuelta ya lo reservó.
      if ((error as { code?: string }).code === "P2002") continue;
      throw error;
    }

    try {
      await sendCartReminderEmail({
        to: latest.purchaserEmail!,
        stage,
        purchaserName: latest.purchaserName,
        eventName: latest.event.name,
        eventDate: latest.event.date,
        eventSlug: latest.event.slug,
        ticketType: latest.ticketType.name,
        promoterCode: latest.promoter?.code ?? null,
      });
      sent++;
    } catch (error) {
      // Liberamos la reserva para reintentar en la próxima vuelta.
      console.error(`Cart reminder failed for ${email} (${eventId}, stage ${stage}):`, error);
      await prisma.cartReminder.delete({ where: { id: reservation.id } });
    }
  }
  return sent;
}
