import type { PhoneMessage } from "@/lib/theme";

/*
 * La bandeja de SMS: los mensajes que te llegan preguntando si de verdad te
 * vas a perder la fecha. El guion vive en el tema (src/lib/theme.ts); acá
 * solo se le mete la fecha y se recorta para la lista.
 *
 * Las horas van escritas a mano, no calculadas: el reloj del servidor y el del
 * navegador nunca coinciden al minuto y romperían la hidratación.
 */

export type { PhoneMessage };

/**
 * El guion con la fecha real adentro. Sin fecha abierta los mensajes quedan
 * en genérico ("el finde") en vez de mostrar un hueco.
 */
export function buildMessages(
  dayDot: string | null,
  script: PhoneMessage[]
): PhoneMessage[] {
  const day = dayDot ? `el ${dayDot}` : "el finde";
  return script.map((m) => ({ ...m, body: m.body.replace("{dia}", day) }));
}

/** El renglón que se ve en la bandeja, cortado como en la pantalla del Nokia. */
export function previewOf(body: string, max = 38): string {
  if (body.length <= max) return body;
  return `${body.slice(0, max).trimEnd()}...`;
}
