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

// El código guardado en el navegador vale solo para el evento cuyo link se
// abrió y vence a las 48 h, para que el descuento de un mail o de un RRPP no
// quede pegado para eventos siguientes. 48 h cubre el recordatorio de carrito
// de las 24 h.
export const PROMOTER_CODE_TTL_MS = 48 * 60 * 60 * 1000;

export interface StoredPromoterCode {
  code: string;
  slug: string;
  savedAt: number;
}

export function storedPromoterCodeFor(
  raw: string | null,
  slug: string,
  now: number
): string | null {
  if (!raw) return null;
  try {
    const stored = JSON.parse(raw) as Partial<StoredPromoterCode>;
    if (typeof stored.code !== "string" || stored.slug !== slug) return null;
    if (typeof stored.savedAt !== "number" || now - stored.savedAt > PROMOTER_CODE_TTL_MS) {
      return null;
    }
    return stored.code;
  } catch {
    return null;
  }
}
