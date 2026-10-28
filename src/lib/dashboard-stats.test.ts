import { describe, expect, it } from "vitest";

import { summarizeStats } from "@/lib/dashboard-stats";

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
