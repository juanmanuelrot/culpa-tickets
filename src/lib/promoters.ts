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
