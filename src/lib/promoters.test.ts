import { describe, expect, it } from "vitest";
import { normalizePromoterCode } from "@/lib/promoters";

describe("normalizePromoterCode", () => {
  it("pasa a minúsculas y saca tildes", () => {
    expect(normalizePromoterCode("JoaquÍn")).toBe("joaquin");
  });

  it("convierte espacios y guiones bajos en guiones", () => {
    expect(normalizePromoterCode("  Juan  Pérez_2 ")).toBe("juan-perez-2");
  });

  it("descarta caracteres que no van en una URL", () => {
    expect(normalizePromoterCode("@juan!/?")).toBe("juan");
  });

  it("devuelve null si no queda nada", () => {
    expect(normalizePromoterCode("!!!")).toBeNull();
    expect(normalizePromoterCode("")).toBeNull();
    expect(normalizePromoterCode(undefined)).toBeNull();
    expect(normalizePromoterCode(42)).toBeNull();
  });

  it("corta en 32 caracteres", () => {
    expect(normalizePromoterCode("a".repeat(50))).toHaveLength(32);
  });
});
