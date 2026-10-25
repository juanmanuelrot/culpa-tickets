import { describe, expect, it } from "vitest";
import {
  applyDiscount,
  normalizeDiscountPercent,
  normalizePromoterCode,
  PROMOTER_CODE_TTL_MS,
  storedPromoterCodeFor,
} from "@/lib/promoters";

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

describe("normalizeDiscountPercent", () => {
  it("acepta números y strings", () => {
    expect(normalizeDiscountPercent(10)).toBe(10);
    expect(normalizeDiscountPercent("15")).toBe(15);
  });

  it("limita entre 0 y 100", () => {
    expect(normalizeDiscountPercent(-5)).toBe(0);
    expect(normalizeDiscountPercent(150)).toBe(100);
  });

  it("devuelve 0 si no es un número", () => {
    expect(normalizeDiscountPercent("abc")).toBe(0);
    expect(normalizeDiscountPercent(undefined)).toBe(0);
    expect(normalizeDiscountPercent("")).toBe(0);
  });
});

describe("applyDiscount", () => {
  it("sin descuento deja el precio igual", () => {
    expect(applyDiscount(123456, 0)).toBe(123456);
  });

  it("descuenta el porcentaje", () => {
    expect(applyDiscount(100000, 10)).toBe(90000);
  });

  it("redondea al peso", () => {
    // $555 - 10% = $499,50 → $500
    expect(applyDiscount(55500, 10)).toBe(50000);
  });

  it("100% deja la entrada en 0", () => {
    expect(applyDiscount(100000, 100)).toBe(0);
  });
});

describe("storedPromoterCodeFor", () => {
  const saved = JSON.stringify({ code: "mail", slug: "fiesta", savedAt: 1000 });

  it("devuelve el código para el mismo evento dentro de las 48 h", () => {
    expect(storedPromoterCodeFor(saved, "fiesta", 1000 + PROMOTER_CODE_TTL_MS)).toBe("mail");
  });

  it("no lo aplica a otro evento", () => {
    expect(storedPromoterCodeFor(saved, "otra-fiesta", 2000)).toBeNull();
  });

  it("vence después de 48 h", () => {
    expect(storedPromoterCodeFor(saved, "fiesta", 1001 + PROMOTER_CODE_TTL_MS)).toBeNull();
  });

  it("ignora el formato viejo (código suelto) y basura", () => {
    expect(storedPromoterCodeFor("mail", "fiesta", 2000)).toBeNull();
    expect(storedPromoterCodeFor(null, "fiesta", 2000)).toBeNull();
  });
});
