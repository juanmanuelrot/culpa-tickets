import { describe, expect, it } from "vitest";

import {
  planReminders,
  reminderKey,
  summarizeReminders,
  type Attempt,
} from "@/lib/cart-reminders";

const HOUR = 60 * 60 * 1000;
const now = new Date("2026-10-25T12:00:00Z");
const ago = (hours: number) => new Date(now.getTime() - hours * HOUR);

function attempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    email: "sofi@mail.com",
    eventId: "ev1",
    createdAt: ago(2),
    mpPaymentStatus: null,
    ...overrides,
  };
}

function plan(
  attempts: Attempt[],
  { confirmed = [] as string[], sent = [] as string[] } = {}
) {
  return planReminders({
    attempts,
    confirmed: new Set(confirmed),
    sent: new Set(sent),
    now,
  });
}

describe("planReminders", () => {
  it("no manda nada antes de la hora", () => {
    expect(plan([attempt({ createdAt: ago(0.5) })])).toEqual([]);
  });

  it("manda el mail 1 pasada la hora", () => {
    const [r, ...rest] = plan([attempt({ createdAt: ago(2) })]);
    expect(rest).toEqual([]);
    expect(r.stage).toBe(1);
    expect(r.email).toBe("sofi@mail.com");
  });

  it("manda el mail 2 pasadas las 24h", () => {
    const [r] = plan([attempt({ createdAt: ago(25) })], {
      sent: [`${reminderKey("sofi@mail.com", "ev1")}|1`],
    });
    expect(r.stage).toBe(2);
  });

  it("no repite una etapa ya mandada", () => {
    const key = reminderKey("sofi@mail.com", "ev1");
    expect(plan([attempt({ createdAt: ago(2) })], { sent: [`${key}|1`] })).toEqual([]);
    expect(
      plan([attempt({ createdAt: ago(25) })], { sent: [`${key}|1`, `${key}|2`] })
    ).toEqual([]);
  });

  it("si se salteó la hora (server caído), a las 24h manda solo el 2", () => {
    const reminders = plan([attempt({ createdAt: ago(30) })]);
    expect(reminders.map((r) => r.stage)).toEqual([2]);
  });

  it("deja afuera los intentos de más de 48h", () => {
    expect(plan([attempt({ createdAt: ago(49) })])).toEqual([]);
  });

  it("varios intentos de la misma persona dan un solo mail, del último intento", () => {
    const reminders = plan([
      attempt({ createdAt: ago(5), ticketId: "viejo" } as Partial<Attempt>),
      attempt({ email: "SOFI@mail.com ", createdAt: ago(1.5), ticketId: "nuevo" } as Partial<Attempt>),
      attempt({ createdAt: ago(3), ticketId: "medio" } as Partial<Attempt>),
    ]);
    expect(reminders).toHaveLength(1);
    expect(reminders[0].stage).toBe(1);
    expect(reminders[0].latest.createdAt).toEqual(ago(1.5));
  });

  it("un reintento corre el mail 2 a 24h del último intento", () => {
    const sent = [`${reminderKey("sofi@mail.com", "ev1")}|1`];
    const attempts = [attempt({ createdAt: ago(26) }), attempt({ createdAt: ago(10) })];
    expect(plan(attempts, { sent })).toEqual([]);
  });

  it("no manda si la persona compró, aunque sea con otro intento", () => {
    const attempts = [attempt({ createdAt: ago(3) })];
    expect(
      plan(attempts, { confirmed: [reminderKey("Sofi@Mail.com", "ev1")] })
    ).toEqual([]);
  });

  it("separa por evento", () => {
    const reminders = plan([
      attempt({ eventId: "ev1" }),
      attempt({ eventId: "ev2" }),
    ]);
    expect(reminders.map((r) => r.eventId).sort()).toEqual(["ev1", "ev2"]);
  });

  it("no manda si algún intento tiene un pago en curso (Abitab, Redpagos)", () => {
    expect(
      plan([
        attempt({ createdAt: ago(5), mpPaymentStatus: "pending" }),
        attempt({ createdAt: ago(2) }),
      ])
    ).toEqual([]);
    expect(plan([attempt({ mpPaymentStatus: "in_process" })])).toEqual([]);
  });

  it("sí manda a los rechazados", () => {
    expect(plan([attempt({ mpPaymentStatus: "rejected" })])).toHaveLength(1);
  });
});

describe("summarizeReminders", () => {
  it("cuenta mails enviados y personas que terminaron comprando", () => {
    const stats = summarizeReminders({
      reminders: [
        { email: "a@x.com", eventId: "ev1", stage: 1 },
        { email: "a@x.com", eventId: "ev1", stage: 2 },
        { email: "b@x.com", eventId: "ev1", stage: 1 },
        { email: "a@x.com", eventId: "ev2", stage: 1 },
      ],
      sold: new Set([reminderKey("A@x.com", "ev1"), reminderKey("c@x.com", "ev1")]),
    });
    expect(stats).toEqual({ sent: 4, recovered: 1 });
  });
});
