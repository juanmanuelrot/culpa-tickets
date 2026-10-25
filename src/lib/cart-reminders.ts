// Carrito abandonado: a quien llegó a pagar con MercadoPago y no terminó le
// mandamos hasta dos mails, a la hora y a las 24h de su último intento. Acá va
// la decisión pura (a quién, cuál); la consulta a la DB y el envío viven en
// cart-reminders-job.ts.

const HOUR = 60 * 60 * 1000;

export const REMINDER_STAGES = [
  { stage: 1, after: 1 * HOUR },
  { stage: 2, after: 24 * HOUR },
] as const;

// Intentos más viejos que esto no se miran: deja margen si el server estuvo
// caído y evita mandarle a gente que abandonó hace días.
export const REMINDER_WINDOW = 48 * HOUR;

// Pagos que MercadoPago todavía puede aprobar (efectivo en Abitab/Redpagos,
// revisión manual). Si la persona ya está pagando, no le recordamos nada.
const IN_FLIGHT_PAYMENT_STATUSES = ["pending", "in_process", "authorized"];

export interface Attempt {
  email: string;
  eventId: string;
  createdAt: Date;
  mpPaymentStatus: string | null;
}

export interface PlannedReminder<T extends Attempt> {
  email: string;
  eventId: string;
  stage: number;
  latest: T;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Una persona en un evento: varios intentos con el mismo email cuentan como uno.
export function reminderKey(email: string, eventId: string): string {
  return `${normalizeEmail(email)}|${eventId}`;
}

interface PlanInput<T extends Attempt> {
  attempts: T[];
  // reminderKey de quienes ya tienen entrada confirmada para ese evento.
  confirmed: Set<string>;
  // `${reminderKey}|${stage}` de los mails ya mandados.
  sent: Set<string>;
  now: Date;
}

export function planReminders<T extends Attempt>({
  attempts,
  confirmed,
  sent,
  now,
}: PlanInput<T>): PlannedReminder<T>[] {
  const groups = new Map<string, T[]>();
  for (const a of attempts) {
    const key = reminderKey(a.email, a.eventId);
    groups.set(key, [...(groups.get(key) ?? []), a]);
  }

  const planned: PlannedReminder<T>[] = [];
  for (const [key, group] of groups) {
    if (confirmed.has(key)) continue;
    if (group.some((a) => IN_FLIGHT_PAYMENT_STATUSES.includes(a.mpPaymentStatus ?? ""))) {
      continue;
    }

    const latest = group.reduce((a, b) => (b.createdAt > a.createdAt ? b : a));
    const age = now.getTime() - latest.createdAt.getTime();
    if (age > REMINDER_WINDOW) continue;

    // La etapa que corresponde es la más avanzada ya vencida. Si el server se
    // salteó la primera, no mandamos las dos juntas: solo la última.
    const due = [...REMINDER_STAGES].reverse().find((s) => age >= s.after);
    if (!due || sent.has(`${key}|${due.stage}`)) continue;

    planned.push({
      email: normalizeEmail(latest.email),
      eventId: latest.eventId,
      stage: due.stage,
      latest,
    });
  }
  return planned;
}

export interface ReminderStats {
  sent: number;
  recovered: number;
}

// Recuperada = una persona a la que le mandamos recordatorio y hoy tiene una
// entrada comprada para ese evento. Como nunca mandamos a quien ya compró, esa
// compra vino después del mail.
export function summarizeReminders({
  reminders,
  sold,
}: {
  reminders: { email: string; eventId: string; stage: number }[];
  sold: Set<string>;
}): ReminderStats {
  const people = new Set(reminders.map((r) => reminderKey(r.email, r.eventId)));
  const recovered = [...people].filter((key) => sold.has(key)).length;
  return { sent: reminders.length, recovered };
}
