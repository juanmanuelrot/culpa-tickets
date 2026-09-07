import { beforeEach, describe, expect, it, vi } from "vitest";

// vi.mock se hoistea sobre este archivo, así que los mocks van adentro de
// vi.hoisted para poder referenciarlos desde el factory de abajo.
const { findUnique, upsert } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  upsert: vi.fn(),
}));
// db.ts arma un pool de pg al importarse; acá no hay base de datos.
vi.mock("@/lib/db", () => ({ prisma: { setting: { findUnique, upsert } } }));

import { getSiteTheme, setSiteTheme } from "@/lib/theme-store";

describe("getSiteTheme", () => {
  beforeEach(() => {
    findUnique.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("devuelve lo guardado cuando es válido", async () => {
    findUnique.mockResolvedValue({ key: "theme", value: "halloween" });
    expect(await getSiteTheme()).toBe("halloween");
  });

  it("sin fila cae al clásico", async () => {
    findUnique.mockResolvedValue(null);
    expect(await getSiteTheme()).toBe("classic");
  });

  it("con un valor desconocido cae al clásico", async () => {
    findUnique.mockResolvedValue({ key: "theme", value: "xmas" });
    expect(await getSiteTheme()).toBe("classic");
  });

  it("con la base caída cae al clásico sin tirar", async () => {
    findUnique.mockRejectedValue(new Error("connection refused"));
    await expect(getSiteTheme()).resolves.toBe("classic");
    expect(console.error).toHaveBeenCalled();
  });
});

describe("setSiteTheme", () => {
  it("hace upsert sobre la clave theme", async () => {
    upsert.mockResolvedValue({});
    await setSiteTheme("halloween");
    expect(upsert).toHaveBeenCalledWith({
      where: { key: "theme" },
      update: { value: "halloween" },
      create: { key: "theme", value: "halloween" },
    });
  });
});
