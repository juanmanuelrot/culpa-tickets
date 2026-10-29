import { describe, expect, it } from "vitest";

import { salesByDay, summarizeStats } from "@/lib/dashboard-stats";

const activo = { isActive: true };
const inactivo = { isActive: false };

describe("summarizeStats", () => {
  it("cuenta solo los eventos activos", () => {
    const stats = summarizeStats({
      events: [activo, activo, inactivo],
      tickets: [],
      whitelistTotal: 0,
    });

    expect(stats.events).toBe(2);
  });

  it("ignora los tickets de eventos inactivos", () => {
    const stats = summarizeStats({
      events: [activo, inactivo],
      tickets: [
        { status: "PAID", event: activo },
        { status: "USED", event: activo },
        { status: "PAID", event: inactivo },
        { status: "USED", event: inactivo },
      ],
      whitelistTotal: 0,
    });

    expect(stats.paidTickets).toBe(1);
    expect(stats.usedTickets).toBe(1);
    expect(stats.tickets).toBe(2);
  });

  it("sigue dejando afuera los tickets sin confirmar de eventos activos", () => {
    const stats = summarizeStats({
      events: [activo],
      tickets: [
        { status: "PAID", event: activo },
        { status: "PENDING_PAYMENT", event: activo },
        { status: "CANCELLED", event: activo },
      ],
      whitelistTotal: 0,
    });

    expect(stats.paidTickets).toBe(1);
    expect(stats.usedTickets).toBe(0);
    expect(stats.tickets).toBe(1);
  });

  it("no cuenta las cortesías como tickets pagados", () => {
    const stats = summarizeStats({
      events: [activo],
      tickets: [
        { status: "PAID", event: activo, origin: "ONLINE" },
        { status: "PAID", event: activo, origin: "OFFLINE_PAID" },
        { status: "PAID", event: activo, origin: "COURTESY" },
      ],
      whitelistTotal: 0,
    });

    expect(stats.paidTickets).toBe(2);
    // Confirmados sigue contando a todos los que entran.
    expect(stats.tickets).toBe(3);
  });

  it("pasa el total de la lista sin filtrar", () => {
    const stats = summarizeStats({
      events: [inactivo],
      tickets: [],
      whitelistTotal: 42,
    });

    expect(stats.whitelisted).toBe(42);
  });

  it("da todo en cero cuando las respuestas no son listas", () => {
    // Los endpoints devuelven `{ error }` si la sesión se venció.
    const stats = summarizeStats({
      events: undefined,
      tickets: undefined,
      whitelistTotal: undefined,
    });

    expect(stats).toEqual({
      events: 0,
      whitelisted: 0,
      tickets: 0,
      paidTickets: 0,
      usedTickets: 0,
      online: { count: 0, amountInCents: 0 },
      offlinePaid: { count: 0, amountInCents: 0 },
      courtesy: { count: 0, amountInCents: 0 },
      byIssuer: [],
    });
  });

  it("separa online, pago por fuera y cortesías con su plata", () => {
    const general = { price: 50000 };
    const stats = summarizeStats({
      events: [activo],
      tickets: [
        { status: "PAID", event: activo, origin: "ONLINE", ticketType: general, discountInCents: 0 },
        { status: "USED", event: activo, origin: "ONLINE", ticketType: general, discountInCents: 10000 },
        { status: "PAID", event: activo, origin: "OFFLINE_PAID", ticketType: general, chargedInCents: 30000, faceValueInCents: 50000 },
        { status: "PAID", event: activo, origin: "COURTESY", ticketType: general, chargedInCents: 0, faceValueInCents: 45000 },
        { status: "PENDING_PAYMENT", event: activo, origin: "ONLINE", ticketType: general },
        { status: "PAID", event: inactivo, origin: "COURTESY", ticketType: general, faceValueInCents: 50000 },
      ],
      whitelistTotal: 0,
    });

    expect(stats.online).toEqual({ count: 2, amountInCents: 90000 });
    expect(stats.offlinePaid).toEqual({ count: 1, amountInCents: 30000 });
    // Las cortesías valen lo que costaban al emitirlas, no el precio de hoy.
    expect(stats.courtesy).toEqual({ count: 1, amountInCents: 45000 });
  });

  it("agrupa los QR por quién los generó, con los sin asignar al final", () => {
    const ana = { id: "u1", name: "Ana" };
    const beto = { id: "u2", name: "Beto" };
    const qr = (origin: string, issuedBy: typeof ana | null, cents: number) => ({
      status: "PAID",
      event: activo,
      origin,
      issuedBy,
      chargedInCents: origin === "COURTESY" ? 0 : cents,
      faceValueInCents: cents,
    });

    const stats = summarizeStats({
      events: [activo],
      tickets: [
        qr("COURTESY", null, 50000),
        qr("COURTESY", ana, 50000),
        qr("OFFLINE_PAID", beto, 40000),
        qr("OFFLINE_PAID", beto, 50000),
        qr("COURTESY", beto, 50000),
      ],
      whitelistTotal: 0,
    });

    expect(stats.byIssuer).toEqual([
      {
        name: "Beto",
        offlinePaid: { count: 2, amountInCents: 90000 },
        courtesy: { count: 1, amountInCents: 50000 },
      },
      {
        name: "Ana",
        offlinePaid: { count: 0, amountInCents: 0 },
        courtesy: { count: 1, amountInCents: 50000 },
      },
      {
        name: null,
        offlinePaid: { count: 0, amountInCents: 0 },
        courtesy: { count: 1, amountInCents: 50000 },
      },
    ]);
  });
});

describe("salesByDay", () => {
  // 28/10 a las 12:00 en Montevideo (-03:00).
  const now = new Date("2026-10-28T15:00:00Z");
  const general = { price: 50000 };

  it("da los últimos 7 días en cero, de más viejo a hoy", () => {
    const days = salesByDay([], now);

    expect(days.map((d) => d.day)).toEqual([
      "2026-10-22",
      "2026-10-23",
      "2026-10-24",
      "2026-10-25",
      "2026-10-26",
      "2026-10-27",
      "2026-10-28",
    ]);
    expect(days.every((d) => d.count === 0 && d.amountInCents === 0)).toBe(true);
    expect(days[6].label).toMatch(/28/);
  });

  it("suma online y pago por fuera por día de Montevideo, sin cortesías", () => {
    const days = salesByDay(
      [
        // 23:30 del 27 en Montevideo, aunque en UTC ya es 28.
        { status: "PAID", event: activo, origin: "ONLINE", ticketType: general, discountInCents: 10000, createdAt: "2026-10-28T02:30:00Z" },
        { status: "USED", event: activo, origin: "ONLINE", ticketType: general, createdAt: "2026-10-27T15:00:00Z" },
        { status: "PAID", event: activo, origin: "OFFLINE_PAID", chargedInCents: 30000, createdAt: "2026-10-28T13:00:00Z" },
        { status: "PAID", event: activo, origin: "COURTESY", faceValueInCents: 50000, createdAt: "2026-10-28T13:00:00Z" },
        { status: "PENDING_PAYMENT", event: activo, origin: "ONLINE", ticketType: general, createdAt: "2026-10-28T13:00:00Z" },
        { status: "PAID", event: inactivo, origin: "ONLINE", ticketType: general, createdAt: "2026-10-28T13:00:00Z" },
        // Hace más de una semana.
        { status: "PAID", event: activo, origin: "ONLINE", ticketType: general, createdAt: "2026-10-21T15:00:00Z" },
      ],
      now
    );

    expect(days[5]).toMatchObject({ day: "2026-10-27", count: 2, amountInCents: 90000 });
    expect(days[6]).toMatchObject({ day: "2026-10-28", count: 1, amountInCents: 30000 });
    expect(days.slice(0, 5).every((d) => d.count === 0)).toBe(true);
  });
});
