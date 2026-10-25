// Códigos de RRPP: van en la URL (?rrpp=<code>), así que se guardan en
// minúsculas y solo con letras, números y guiones. Devuelve null si no queda
// nada usable.
export function normalizePromoterCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  return code || null;
}

// Acepta un % de descuento entero entre 0 y 100; cualquier otra cosa es 0.
export function normalizeDiscountPercent(raw: unknown): number {
  const n = typeof raw === "string" ? Number(raw) : raw;
  if (typeof n !== "number" || !Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

// Precio en centavos con el descuento del RRPP aplicado, redondeado al peso
// para que MercadoPago no muestre centavos sueltos.
export function applyDiscount(priceInCents: number, discountPercent: number): number {
  if (discountPercent <= 0) return priceInCents;
  const discounted = (priceInCents * (100 - discountPercent)) / 100;
  return Math.round(discounted / 100) * 100;
}
