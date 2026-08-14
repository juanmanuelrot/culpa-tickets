/*
 * El guion de la bandeja de SMS: los mensajes que te llegan preguntando si de
 * verdad te vas a perder la fecha. Vive acá y no en la pantalla para que
 * cambiarle el texto no sea tocar el layout.
 *
 * Las horas van escritas a mano, no calculadas: el reloj del servidor y el del
 * navegador nunca coinciden al minuto y romperían la hidratación.
 */

export interface PhoneMessage {
  /** Cómo está guardado en la agenda. */
  from: string;
  /** Hora fija, en el formato del status bar. */
  time: string;
  /** El SMS entero. `{dia}` se reemplaza por la fecha de la próxima tocada. */
  body: string;
}

const SCRIPT: PhoneMessage[] = [
  {
    from: "SOFI",
    time: "21:04",
    body: "vas o no vas?? ya compre la mia, no me dejes sola eh",
  },
  {
    from: "MATI",
    time: "20:51",
    body: "boludo {dia} va a estar demasiado. no me lo pierdo ni en pedo",
  },
  {
    from: "NICO (?)",
    time: "19:32",
    body: "hola! vas a ir a culpa {dia}? preguntaba por preguntar",
  },
  {
    from: "MAMA",
    time: "18:10",
    body: "hija a que hora volves? llevate abrigo",
  },
  {
    from: "CULPA",
    time: "17:00",
    body: "quedan pocas. despues no digas que no te avisamos.",
  },
];

/**
 * El guion con la fecha real adentro. Sin fecha abierta los mensajes quedan
 * en genérico ("el finde") en vez de mostrar un hueco.
 */
export function buildMessages(dayDot: string | null): PhoneMessage[] {
  const day = dayDot ? `el ${dayDot}` : "el finde";
  return SCRIPT.map((m) => ({ ...m, body: m.body.replace("{dia}", day) }));
}

/** El renglón que se ve en la bandeja, cortado como en la pantalla del Nokia. */
export function previewOf(body: string, max = 38): string {
  if (body.length <= max) return body;
  return `${body.slice(0, max).trimEnd()}...`;
}
