import { describe, expect, it, vi } from "vitest";

// El mail real arrastra Resend y Prisma; acá solo importa qué devuelve.
const sendTicketEmail = vi.fn();
vi.mock("@/lib/email", () => ({
  sendTicketEmail: (...args: unknown[]) => sendTicketEmail(...args),
}));
vi.mock("@/lib/qr", () => ({
  generateQRCodeBuffer: vi.fn(async () => Buffer.from("qr")),
}));

import { emailQrTicket, isQrOrigin, resolveQrAmounts } from "@/lib/qr-tickets";

describe("resolveQrAmounts", () => {
  it("una cortesía no cobra nada y guarda el precio de la entrada", () => {
    expect(resolveQrAmounts("COURTESY", 30000, 50000)).toEqual({
      chargedInCents: 0,
      faceValueInCents: 50000,
    });
  });

  it("un pago por fuera guarda lo que se cobró", () => {
    expect(resolveQrAmounts("OFFLINE_PAID", 40000, 50000)).toEqual({
      chargedInCents: 40000,
      faceValueInCents: 50000,
    });
  });

  it("un pago por fuera sin monto usa el precio de la entrada", () => {
    expect(resolveQrAmounts("OFFLINE_PAID", null, 50000)).toEqual({
      chargedInCents: 50000,
      faceValueInCents: 50000,
    });
    expect(resolveQrAmounts("OFFLINE_PAID", undefined, 50000)).toEqual({
      chargedInCents: 50000,
      faceValueInCents: 50000,
    });
  });

  it("rechaza montos negativos, con decimales o que no son números", () => {
    expect(resolveQrAmounts("OFFLINE_PAID", -100, 50000)).toBeNull();
    expect(resolveQrAmounts("OFFLINE_PAID", 10.5, 50000)).toBeNull();
    expect(resolveQrAmounts("OFFLINE_PAID", "400", 50000)).toBeNull();
  });
});

describe("isQrOrigin", () => {
  it("acepta solo cortesía y pago por fuera", () => {
    expect(isQrOrigin("COURTESY")).toBe(true);
    expect(isQrOrigin("OFFLINE_PAID")).toBe(true);
    expect(isQrOrigin("ONLINE")).toBe(false);
    expect(isQrOrigin(undefined)).toBe(false);
  });
});

describe("emailQrTicket", () => {
  const ticket = {
    purchaserEmail: "sofi@example.com",
    purchaserName: "Sofi",
    qrSignedJwt: "jwt",
    event: { name: "Culpa", date: new Date("2026-11-01T03:00:00Z") },
    ticketType: { name: "General" },
  };

  it("avisa si Resend no pudo mandar el mail", async () => {
    // Resend no tira: devuelve el error, y sin esto la pantalla diría "enviado".
    sendTicketEmail.mockResolvedValueOnce({
      data: null,
      error: { message: "API key is invalid" },
    });

    await expect(emailQrTicket(ticket)).rejects.toThrow("API key is invalid");
  });

  it("no hace nada raro cuando sale bien", async () => {
    sendTicketEmail.mockResolvedValueOnce({ data: { id: "1" }, error: null });

    await expect(emailQrTicket(ticket)).resolves.toBeUndefined();
    expect(sendTicketEmail).toHaveBeenLastCalledWith(
      expect.objectContaining({ to: "sofi@example.com", purchaserName: "Sofi" })
    );
  });
});
