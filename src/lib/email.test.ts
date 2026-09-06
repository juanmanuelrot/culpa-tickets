import { beforeEach, describe, expect, it, vi } from "vitest";

// El módulo instancia Resend al cargar y Resend exige API key; y el store del
// tema arrastra Prisma. Ninguno de los dos hace falta para armar HTML.
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: vi.fn() };
  },
}));
vi.mock("@/lib/theme-store", () => ({
  getSiteTheme: vi.fn(async () => "classic"),
}));

import { buildTicketEmail, buildWelcomeEmail } from "@/lib/email";
import { THEMES } from "@/lib/theme";

const ticketParams = {
  to: "a@b.c",
  eventName: "Culpa Halloween",
  ticketType: "General",
  date: "31 de octubre",
  purchaserName: "Sofi",
  qrCodeBuffer: Buffer.from("qr"),
};

describe("buildTicketEmail", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = "https://culpa.test";
  });

  it("sin tema pinta el clásico", () => {
    const { html } = buildTicketEmail(ticketParams);
    expect(html).toContain("#c9d92c");
    expect(html).toContain("#2b3ad8");
    expect(html).not.toContain("#f4841f");
  });

  it("con Halloween pinta calabaza y violeta, y nada de lima ni azul", () => {
    const { html } = buildTicketEmail(ticketParams, THEMES.halloween);
    expect(html).toContain("#f4841f");
    expect(html).toContain("#5b2a86");
    expect(html).toContain("#523112");
    expect(html).not.toContain("#c9d92c");
    expect(html).not.toContain("#2b3ad8");
    expect(html).not.toContain("#454a16");
  });

  it("el QR viaja inline por content-id", () => {
    const { html, attachments } = buildTicketEmail(ticketParams);
    expect(attachments[0].contentId).toBe("culpa-qr");
    expect(html).toContain("cid:culpa-qr");
  });
});

describe("buildWelcomeEmail", () => {
  it("usa el subtítulo del tema", () => {
    const params = { to: "a@b.c", name: "Sofi", events: [] };
    expect(buildWelcomeEmail(params).html).toContain("Reggaeton nostalgico");
    expect(buildWelcomeEmail(params, THEMES.halloween).html).toContain(
      "Reggaeton de ultratumba"
    );
  });
});
