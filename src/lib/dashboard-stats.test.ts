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
    });
  });
});
